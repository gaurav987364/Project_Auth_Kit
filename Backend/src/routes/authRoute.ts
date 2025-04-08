import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  verifyEmail,
  forgotPassword,
} from "../controllers/authController";

const authRouter = Router();

//making auth routes

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verify/email", verifyEmail);
authRouter.post("/password/forgot", forgotPassword);

//route for refresh token
authRouter.get("/refresh", refreshToken);

export default authRouter;
