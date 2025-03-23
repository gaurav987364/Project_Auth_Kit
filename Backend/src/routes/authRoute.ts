import { Router } from "express";
import { register, login } from "../controllers/authController";

const authRouter = Router();

//making auth routes

authRouter.post("/register", register);
authRouter.post("/login", login);

export default authRouter;
