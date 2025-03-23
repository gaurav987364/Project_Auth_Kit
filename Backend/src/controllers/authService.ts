import jwt from "jsonwebtoken";
import SessionModel from "../database/models/sessionModel";
import UserModel from "../database/models/userModel";
import VerificationCodeModel, {
  Verifications,
} from "../database/models/verificationModel";
import { ErrorCode } from "../utils/enums/errorCode-enums";
import { BadRequestException } from "../utils/ErrorTypes";
import { fortyFiveMinutesFromNow } from "../utils/helper";
import { loginDataProps, registerDataProps } from "../utils/interface/types";
import { config } from "../config/app.config";

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
  const accessToken = jwt.sign(
    {
      userId: existingUser._id,
      sessionId: session._id,
    },
    config.JWT.SECRET as jwt.Secret,
    {
      audience: "existingUser",
      expiresIn: config.JWT.EXPIRES_IN,
    } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { sessionId: session._id },
    config.JWT.REFRESH_SECRET as jwt.Secret,
    {
      audience: "existingUser",
      expiresIn: config.JWT.REFRESH_EXPIRES_IN,
    } as jwt.SignOptions
  );

  return {
    accessToken,
    refreshToken,
    user: existingUser,
    mfaRequired: false,
  };
};
