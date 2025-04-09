import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { GetAllSessionService } from "./sessionService";
import { HTTPSTATUS } from "../config/http.config";

const getAllSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const sessionId = req.sessionId;

  const { sessions } = await GetAllSessionService(userId);
  console.log(sessions);

  const modifySessions = sessions.map((session) => ({
    ...session.toObject(),
    ...(session.id === sessionId && {
      isCurrent: true,
    }),
  }));

  return res.status(HTTPSTATUS.OK).json({
    message: "Retrieved all session successfully",
    sessions: modifySessions,
  });
});
const getSession = asyncHandler(async (req: Request, res: Response) => {});
const deleteSession = asyncHandler(async (req: Request, res: Response) => {});

export { getAllSessions, getSession, deleteSession };
