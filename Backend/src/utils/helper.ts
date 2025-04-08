import { add } from "date-fns";
import { HttpStatusCode, HTTPSTATUS } from "../config/http.config";
import { ErrorCode } from "./enums/errorCode-enums";
import { v4 as uuidv4 } from "uuid";

export const getENV = (key: string, defaultValue: string = ""): string => {
  const values = process.env[key];
  if (values === undefined) {
    if (defaultValue) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} does not exist`);
  }
  return values;
};

//error class for error messages based on the error code
export class AppError extends Error {
  public statusCode: HttpStatusCode;
  public errorCode: ErrorCode;

  constructor(
    message: string,
    statusCode = HTTPSTATUS.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

//session expires function
export const ThirtyDaysFromNow = (): Date => {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};

//expires from fortyFiveMinutesFromNow now function
export const fortyFiveMinutesFromNow = (): Date => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 45);
  return now;
};

export const tenMinutesAgo = (): Date => new Date(Date.now() - 10 * 60 * 1000);

export const threeMinutesAgo = (): Date => new Date(Date.now() - 3 * 60 * 1000);

export const anHourFromNow = (): Date => new Date(Date.now() + 60 * 60 * 1000);

//generateUniqueVerificationCode for sending in mail
export const generateUniqueVerificationCode = () => {
  console.log(uuidv4().replace(/-/g, "").substring(0, 25));
  return uuidv4().replace(/-/g, "").substring(0, 25);
};

// calculate cookie expiration date
export const calculateExpirationDate = (expiresIn: string = "15m"): Date => {
  // Match number + unit (m = minutes, h = hours, d = days)
  const match = expiresIn.match(/^(\d+)([mhd])$/);
  if (!match) throw new Error('Invalid format. Use "15m", "1h", or "2d".');
  const [, value, unit] = match;
  const expirationDate = new Date();

  // Check the unit and apply accordingly
  switch (unit) {
    case "m": // minutes
      return add(expirationDate, { minutes: parseInt(value) });
    case "h": // hours
      return add(expirationDate, { hours: parseInt(value) });
    case "d": // days
      return add(expirationDate, { days: parseInt(value) });
    default:
      throw new Error('Invalid unit. Use "m", "h", or "d".');
  }
};

export const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds
