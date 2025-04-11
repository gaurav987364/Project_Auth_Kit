import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import {
  CreateMFASetupService,
  RevokeMFAService,
  VerifyLoginMFAService,
  VerifyMFASetupService,
} from "./mfaService";
import { HTTPSTATUS } from "../config/http.config";
import {
  verifyMfaForLoginSchema,
  verifyMFASchema,
} from "../utils/validators/mfa.validator";
import { setAuthenticationCookies } from "../utils/setCookies";

const createMFASetup = asyncHandler(async (req: Request, res: Response) => {
  const { message, qrImageLink, secret } = await CreateMFASetupService(req);

  return res.status(HTTPSTATUS.OK).json({
    message,
    secret,
    qrImageLink,
  });
});

const verifyMFASetup = asyncHandler(async (req: Request, res: Response) => {
  console.log(req.body);
  const { code, secret } = verifyMFASchema.parse({
    ...req.body,
  });

  const { message, userPreferences } = await VerifyMFASetupService(
    req,
    code,
    secret
  );

  return res.status(HTTPSTATUS.OK).json({
    message: message,
    userPreferences: userPreferences,
  });
});

const revokeMFA = asyncHandler(async (req: Request, res: Response) => {
  const { message, userPreferences } = await RevokeMFAService(req);

  return res.status(HTTPSTATUS.OK).json({
    message,
    userPreferences,
  });
});

const verifyMFALogin = asyncHandler(async (req: Request, res: Response) => {
  const { code, email, userAgent } = verifyMfaForLoginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  const { accessToken, refreshToken, user } = await VerifyLoginMFAService(
    code,
    email,
    userAgent
  );

  return setAuthenticationCookies({
    res,
    accessToken,
    refreshToken,
  })
    .status(HTTPSTATUS.OK)
    .json({
      message: "Verified & Login Successfully",
      user,
    });
});

export { createMFASetup, verifyMFASetup, revokeMFA, verifyMFALogin };
