import SessionModel from "../database/models/sessionModel";
import UserModel from "../database/models/userModel";
import bcrypt from "bcrypt";
import VerificationCodeModel, {
  Verifications,
} from "../database/models/verificationModel";
import { ErrorCode } from "../utils/enums/errorCode-enums";
import {
  BadRequestException,
  HttpException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/ErrorTypes";
import {
  anHourFromNow,
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
  threeMinutesAgo,
} from "../utils/helper";
import { loginDataProps, registerDataProps } from "../utils/interface/types";
import { config } from "../config/app.config";
import {
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyJwtToken,
} from "../utils/jwt";
import { sendEmail } from "../mailers/mailer";
import {
  passwordResetTemplate,
  verifyEmailTemplate,
} from "../mailers/templates/template";
import { HTTPSTATUS } from "../config/http.config";

export const RegisterService = async (registerData: registerDataProps) => {
  const { name, email, password } = registerData;

  const existingUser = await UserModel.exists({ email });

  if (existingUser) {
    throw new BadRequestException(
      "User already exists with this email",
      ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
    );
  }
  const newUser = await UserModel.create({
    name,
    email,
    password,
  });

  const userId = newUser._id;

  //create verification code
  const verificationCode = await VerificationCodeModel.create({
    userId,
    type: Verifications.EMAIL_VERIFICATION,
    expiresAt: fortyFiveMinutesFromNow(),
  });

  //sending verification code to email link;
  const verificationUrl = `${config.APP_ORIGIN}/confirm-account?code=${verificationCode.code}`;
  await sendEmail({
    to: newUser.email,
    ...verifyEmailTemplate(verificationUrl),
  });
  return {
    user: newUser,
  };
};

//login service
export const LoginService = async (loginData: loginDataProps) => {
  const { email, password, userAgent } = loginData;

  //find user by email
  const existingUser = await UserModel.findOne({ email });

  if (!existingUser) {
    throw new BadRequestException(
      "User not found.",
      ErrorCode.AUTH_USER_NOT_FOUND
    );
  }

  //check and match password
  const isPasswordValid = await existingUser.comparePasswords(password);

  //if pass is not valid
  if (!isPasswordValid) {
    throw new BadRequestException(
      "Bad Credentials.",
      ErrorCode.AUTH_USER_NOT_FOUND
    );
  }

  //check if the user enable 2fa return user null
  if (existingUser.userPreferences.enable2FA) {
    return {
      user: null,
      mfaRequired: true,
      accessToken: "",
      refreshToken: "",
    };
  }

  const session = await SessionModel.create({
    userId: existingUser._id,
    userAgent,
  });

  //access token
  const accessToken = signJwtToken({
    userId: existingUser._id,
    sessionId: session._id,
  });

  const refreshToken = signJwtToken(
    {
      sessionId: session._id,
    },
    refreshTokenSignOptions
  );

  return {
    accessToken,
    refreshToken,
    user: existingUser,
    mfaRequired: false,
  };
};

//refresh token service
export const RefreshTokenService = async (refreshToken: string) => {
  //verify refresh token
  const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  console.log("payload", payload);

  if (!payload) {
    throw new UnauthorizedException("Invalid refresh token");
  }

  const session = await SessionModel.findById(payload.sessionId);
  const now = Date.now();

  if (!session) {
    throw new UnauthorizedException("Session does not exist");
  }

  if (session.expiresAt.getTime() <= now) {
    throw new UnauthorizedException("Session expired");
  }

  const sessionRequireRefresh =
    session.expiresAt.getTime() - now <= ONE_DAY_IN_MS;

  if (sessionRequireRefresh) {
    session.expiresAt = calculateExpirationDate(config.JWT.REFRESH_EXPIRES_IN);
    await session.save();
  }

  const newRefreshToken = sessionRequireRefresh
    ? signJwtToken(
        {
          sessionId: session._id,
        },
        refreshTokenSignOptions
      )
    : undefined;

  const accessToken = signJwtToken({
    userId: session.userId,
    sessionId: session._id,
  });

  return {
    accessToken,
    newRefreshToken,
  };
};

//verify email service;
export const VerifyEmailService = async (code: string) => {
  const validCode = await VerificationCodeModel.findOne({
    code: code,
    type: Verifications.EMAIL_VERIFICATION,
    expiresAt: { $gt: new Date() },
  });

  if (!validCode) {
    throw new BadRequestException("Invalid Code.");
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      isEmailverified: true,
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new BadRequestException(
      "Unable to verify email address.",
      ErrorCode.VALIDATION_ERROR
    );
  }

  await validCode.deleteOne();
  return {
    user: updatedUser,
  };
};

//forgot password service;
export const ForgotPasswordService = async (email: string) => {
  const user = await UserModel.findOne({ email: email });

  if (!user) {
    throw new NotFoundException("User Not Found.");
  }

  //? check mail rate limit is 2 email per 3 or 10 min.
  const timeAgo = threeMinutesAgo();
  const maxAttempts = 2;

  const count = await VerificationCodeModel.countDocuments({
    userId: user._id,
    type: Verifications.PASSWORD_RESET,
    createdAt: { $gt: timeAgo },
  });

  console.log(count);

  if (count >= maxAttempts) {
    throw new HttpException(
      "Too Many Request, try again later.",
      HTTPSTATUS.TOO_MANY_REQUESTS,
      ErrorCode.AUTH_TOO_MANY_ATTEMPTS
    );
  }

  const expiresAt = anHourFromNow();
  const validCode = await VerificationCodeModel.create({
    userId: user._id,
    type: Verifications.PASSWORD_RESET,
    expiresAt,
  });
  console.log(validCode);

  const resetLink = `${config.APP_ORIGIN}/reset-password?code=${
    validCode.code
  }$exp=${expiresAt.getTime()}`;

  const { data, error } = await sendEmail({
    to: user.email,
    ...passwordResetTemplate(resetLink),
  });

  console.log(data?.id);

  if (!data?.id) {
    throw new InternalServerException(`${error?.name} ${error?.message}`);
  }

  return {
    url: resetLink,
    emailId: data.id,
  };
};

//reset password service;
export const ResetPasswordService = async (body: any) => {
  const { password, verificationCode } = body;
  const validCode = await VerificationCodeModel.findOne({
    code: verificationCode,
    type: Verifications.PASSWORD_RESET,
    expiresAt: { $gt: new Date() },
  });

  if (!validCode) {
    throw new NotFoundException("Invalid Code or Expired Code.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, {
    password: hashedPassword,
  });

  if (!updatedUser) {
    throw new BadRequestException("Failed to reset password.");
  }

  await validCode.deleteOne();

  await SessionModel.deleteMany({
    userId: updatedUser._id,
  });
  return {
    user: updatedUser,
  };
};

//logout service
export const LogoutService = async (sessionId: string) => {
  return await SessionModel.findByIdAndDelete(sessionId);
};
