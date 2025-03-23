import { CookieOptions, Response } from "express";
import { CookiePayloadType } from "./interface/types";
import { config } from "../config/app.config";
import { calculateExpirationDate } from "../utils/helper";

//path
export const REFRESH_PATH: string = `${config.BASE_PATH}/auth/refresh`;

//making options for cookies
const defaults: CookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production" ? true : false,
  sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
};

//get refresh token cookie options function
export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.JWT.REFRESH_EXPIRES_IN;
  const expires = calculateExpirationDate(expiresIn);
  return { ...defaults, expires, path: REFRESH_PATH };
};

//get access token cookie options function
export const getAccessTokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.JWT.EXPIRES_IN;
  const expires = calculateExpirationDate(expiresIn);
  return { ...defaults, expires, path: "/" };
};

//set cookies function on login
export const setAuthenticationCookies = ({
  res,
  accessToken,
  refreshToken,
}: CookiePayloadType): Response => {
  return res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
};

export const clearAuthenticationCookies = (res: Response): Response => {
  return res.clearCookie("accessToken").clearCookie("refreshToken", {
    path: REFRESH_PATH,
  });
};
