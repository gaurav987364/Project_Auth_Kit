import { configDotenv } from "dotenv";
import express, { Request, Response } from "express";
import cookieParser = require("cookie-parser");
import cors from "cors";
import { config } from "./config/app.config";
import connectDB from "./database/models/db";
import { errorHandler } from "./middlewares/errorHandler";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler";
import authRouter from "./routes/authRoute";
import passport from "./middlewares/passport";
import { authenticateJWT } from "./strategies/jwt-strategy";
import sessionRoutes from "./routes/sessionRoutes";
//! Very important to import like this above line ok

const BASE_PATH = config.BASE_PATH;
configDotenv();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//setup passport middlewre;
app.use(passport.initialize());

app.use(
  cors({
    origin: config.APP_ORIGIN,
    credentials: true,
  })
);

//connect to db
connectDB();

// Define routes
app.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).send({
      message: "Welcome in learning of Project Auth...",
    });
  })
);

//setting up routes middlewares
app.use(`${BASE_PATH}/auth`, authRouter);

//session routes with startegy
app.use(`${BASE_PATH}/session`, authenticateJWT, sessionRoutes);

//import errors handler after all routes
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});
