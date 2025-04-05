import SessionModel from "../database/models/sessionModel";
import UserModel from "../database/models/userModel";
import VerificationCodeModel, {
  Verifications,
} from "../database/models/verificationModel";
import { ErrorCode } from "../utils/enums/errorCode-enums";
import {
  BadRequestException,
  UnauthorizedException,
} from "../utils/ErrorTypes";
import {
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
} from "../utils/helper";
import { loginDataProps, registerDataProps } from "../utils/interface/types";
import { config } from "../config/app.config";
import {
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyJwtToken,
} from "../utils/jwt";

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
