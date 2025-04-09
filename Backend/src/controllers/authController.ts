import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { HTTPSTATUS } from "../config/http.config";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  VerificationSchema,
} from "../utils/validators/auth.validator";
import {
  ForgotPasswordService,
  LoginService,
  LogoutService,
  RefreshTokenService,
  RegisterService,
  ResetPasswordService,
  VerifyEmailService,
} from "./authService";
import {
  clearAuthenticationCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookies,
} from "../utils/setCookies";
import { NotFoundException, UnauthorizedException } from "../utils/ErrorTypes";

const register = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const body = registerSchema.parse({
      ...req.body,
    });
    // Implement logic to register the user
    const { user } = await RegisterService(body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User registered successfully.",
      data: user,
    });
  }
);

const login = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userAgent = req.headers["user-agent"];
    const body = loginSchema.parse({
      ...req.body,
      userAgent,
    });

    const { user, accessToken, mfaRequired, refreshToken } = await LoginService(
      body
    );

    return setAuthenticationCookies({
      res,
      accessToken,
      refreshToken,
    })
      .status(HTTPSTATUS.OK)
      .json({
        message: "User logged in successfully.",
        mfaRequired,
        user,
      });
  }
);

//refresh token route
const refreshToken = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const myRefreshToken = req.cookies.refreshToken as string | undefined;

    console.log("myRefreshToken", myRefreshToken);

    if (!myRefreshToken) {
      throw new UnauthorizedException("User not authenticated.");
    }

    const { accessToken, newRefreshToken } = await RefreshTokenService(
      myRefreshToken
    );
    console.log("accessToken", accessToken);
    console.log("refreshToken", newRefreshToken);

    if (newRefreshToken) {
      res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
    }

    return res
      .status(HTTPSTATUS.OK)
      .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
      .json({
        message: "Refresh access token successfully.",
      });
  }
);

//verify email
const verifyEmail = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { code } = VerificationSchema.parse(req.body);

    await VerifyEmailService(code);

    return res.status(HTTPSTATUS.OK).json({
      message: "Email Verified Successfully.",
    });
  }
);

//forgot password
const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const email = emailSchema.parse(req.body.email);

    await ForgotPasswordService(email);

    return res.status(HTTPSTATUS.OK).json({
      message: "Password reset email sent to your e-mail",
    });
  }
);

//reset password
const resetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const body = resetPasswordSchema.parse(req.body);

    await ResetPasswordService(body);

    return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
      message: "Reset Password Successfully.",
    });
  }
);

//logout
const logout = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const sessionId = req.sessionId;
    if (!sessionId) {
      throw new NotFoundException("Session is invalid.");
    }
    await LogoutService(sessionId);
    return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
      message: "User logout successfully",
    });
  }
);
export {
  register,
  login,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
};
