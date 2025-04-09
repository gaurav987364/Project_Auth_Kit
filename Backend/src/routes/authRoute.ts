import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/authController";
import { authenticateJWT } from "../strategies/jwt-strategy";

const authRouter = Router();

//making auth routes

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verify/email", verifyEmail);
authRouter.post("/password/forgot", forgotPassword);
authRouter.post("/password/reset", resetPassword);
authRouter.post("/logout", authenticateJWT, logout);

//route for refresh token
authRouter.get("/refresh", refreshToken);

export default authRouter;
