import { UserDocument } from "../database/models/userModel";
import { Request } from "express";
declare global {
  namespace Express {
    interface User extends UserDocument {}
    interface Request {
      sessionId?: string;
    }
  }
}
