import { Request } from "express";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/ErrorTypes";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import UserModel from "../database/models/userModel";
import SessionModel from "../database/models/sessionModel";
import { refreshTokenSignOptions, signJwtToken } from "../utils/jwt";

export const CreateMFASetupService = async (req: Request) => {
  const user = req.user;

  if (!user) {
    throw new UnauthorizedException("User Not Authorized.");
  }

  if (user.userPreferences.enable2FA) {
    return {
      message: "MFA already enabled.",
    };
  }

  let secretkey = user.userPreferences.twoFactorSecret;

  if (!secretkey) {
    const secret = speakeasy.generateSecret({ name: "Squeezy" });
    secretkey = secret.base32;
    user.userPreferences.twoFactorSecret = secretkey;
    await user.save();
  }

  const url = speakeasy.otpauthURL({
    secret: secretkey,
    label: `${user.name}`,
    issuer: "squeezy.com",
    encoding: "base32",
  });

  const qrImageLink = await qrcode.toDataURL(url);

  return {
    message: "Scan the QR code or use the setup key.",
    secret: secretkey,
    qrImageLink,
  };
};

export const VerifyMFASetupService = async (
  req: Request,
  code: string,
  secretkey: string
) => {
  console.log(code);
  console.log(secretkey);
  const user = req.user;

  if (!user) {
    throw new UnauthorizedException("User Not Authorized.");
  }

  if (user.userPreferences.enable2FA) {
    return {
      message: "MFA already enabled.",
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    };
  }

  const isValid = speakeasy.totp.verify({
    secret: secretkey,
    encoding: "base32",
    token: code,
  });

  if (!isValid) {
    throw new BadRequestException("Invaild MFA Code, Please try again.");
  }

  user.userPreferences.enable2FA = true;
  await user.save();

  return {
    message: "MFA Setup Completed Succesfully.",
    userPreferences: {
      enable2FA: user.userPreferences.enable2FA,
    },
  };
};

export const RevokeMFAService = async (req: Request) => {
  const user = req.user;

  if (!user) {
    throw new UnauthorizedException("User not authorized");
  }

  if (!user.userPreferences.enable2FA) {
    return {
      message: "MFA is not enabled",
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    };
  }

  user.userPreferences.twoFactorSecret = undefined;
  user.userPreferences.enable2FA = false;
  await user.save();

  return {
    message: "MFA revoke successfully",
    userPreferences: {
      enable2FA: user.userPreferences.enable2FA,
    },
  };
};

export const VerifyLoginMFAService = async (
  code: string,
  email: string,
  userAgent?: string
) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new NotFoundException("User Not Found");
  }

  if (
    !user.userPreferences.enable2FA &&
    !user.userPreferences.twoFactorSecret
  ) {
    throw new UnauthorizedException("MFA not enabled for this user.");
  }

  const isValid = speakeasy.totp.verify({
    secret: user.userPreferences.twoFactorSecret!,
    encoding: "base32",
    token: code,
  });

  if (!isValid) {
    throw new BadRequestException("Invalid MFA code. Please try again.");
  }

  // sign acces & refresh token
  const session = await SessionModel.create({
    userId: user._id,
    userAgent,
  });

  const accessToken = signJwtToken({
    userId: user._id,
    sessionId: session._id,
  });

  const refreshToken = signJwtToken(
    {
      sessionId: session._id,
    },
    refreshTokenSignOptions
  );

  return {
    user,
    accessToken,
    refreshToken,
  };
};
