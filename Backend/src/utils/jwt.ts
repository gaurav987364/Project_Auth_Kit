import { SignOptions } from "jsonwebtoken";
import { SessionDocument } from "../database/models/sessionModel";
import { UserDocument } from "../database/models/userModel";
import { config } from "../config/app.config";
import jwt, { VerifyOptions } from "jsonwebtoken";

export type AccessTPayload = {
  userId: UserDocument["_id"];
  sessionId: SessionDocument["_id"];
};

export type RefreshTPayload = {
  sessionId: SessionDocument["_id"];
};

type SignOptsAndSecret = SignOptions & {
  secret: string;
};

const defaults: SignOptions = {
  audience: ["existingUser"],
};

export const accessTokenSignOptions: SignOptsAndSecret = {
  expiresIn: 15 * 60 * 1000, // 15 minutes
  secret: config.JWT.SECRET,
};

export const refreshTokenSignOptions: SignOptsAndSecret = {
  expiresIn: 30 * 24 * 60 * 60 * 1000, // 30 days
  secret: config.JWT.REFRESH_SECRET,
};

export const signJwtToken = (
  payload: AccessTPayload | RefreshTPayload,
  options?: SignOptsAndSecret
) => {
  const { secret, ...opts } = options || accessTokenSignOptions;
  return jwt.sign(payload, secret, {
    ...defaults,
    ...opts,
  });
};

export const verifyJwtToken = <TPayload extends object = AccessTPayload>(
  token: string,
  options?: VerifyOptions & { secret: string }
) => {
  try {
    const { secret = config.JWT.SECRET, ...opts } = options || {};
    const payload = jwt.verify(token, secret, {
      ...defaults,
      ...opts,
    }) as TPayload;
    return { payload };
  } catch (err: any) {
    return {
      error: err.message,
    };
  }
};
