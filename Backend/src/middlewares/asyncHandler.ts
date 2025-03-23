import { NextFunction, Request, Response } from "express";

interface AsyncHandler {
  (req: Request, res: Response, next: NextFunction): Promise<any>;
}

export const asyncHandler =
  (controller: AsyncHandler): AsyncHandler =>
  async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
