import { Response } from "express";

export interface registerDataProps {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface loginDataProps {
  email: string;
  password: string;
  userAgent?: string;
}

export type CookiePayloadType = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};
