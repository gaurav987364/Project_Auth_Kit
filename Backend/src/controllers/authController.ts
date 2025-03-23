import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { HTTPSTATUS } from "../config/http.config";
import {
  loginSchema,
  registerSchema,
} from "../utils/validators/auth.validator";
import { LoginService, RegisterService } from "./authService";
import { setAuthenticationCookies } from "../utils/setCookies";

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

export { register, login };
