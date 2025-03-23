import { ErrorRequestHandler, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { AppError } from "../utils/helper";
import { ZodError } from "zod";
import { clearAuthenticationCookies, REFRESH_PATH } from "../utils/setCookies";

//functon for zod error
function formatZodError(res: Response, error: ZodError) {
  const errors = error?.issues?.map((err) => {
    return {
      field: err.path.join("."),
      message: err.message,
    };
  });
  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: "Validation Failed",
    errors: errors,
  });
}

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  console.error(`Error occurred on path : ${req.path}`, error);

  //for refresh token endpoint clear the cookies and ye hm simpley agar path ,atch nhi hota error do varna call kro or cookies set krdo
  if (req.path === REFRESH_PATH) {
    clearAuthenticationCookies(res);
  }

  //defining the types of error occured
  if (error instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid JSON syntax.",
      error: error?.message || "Unknown error occurred.",
    });
  }

  //zod error
  if (error instanceof ZodError) {
    return formatZodError(res, error);
  }

  //this handle the all types of error occured based on that retun code and message
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Unknown error occurred.",
  });
};
