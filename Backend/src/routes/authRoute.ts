import { Router } from "express";
import { register, login, refreshToken } from "../controllers/authController";

const authRouter = Router();

//making auth routes

authRouter.post("/register", register);
authRouter.post("/login", login);

//route for refresh token
authRouter.get("/refresh", refreshToken);

export default authRouter;
