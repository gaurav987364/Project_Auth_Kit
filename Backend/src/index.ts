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
const BASE_PATH = config.BASE_PATH;
configDotenv();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
//import errors handler after all routes
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});
