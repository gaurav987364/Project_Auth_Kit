import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import {
  DeleteSessionService,
  GetAllSessionService,
  GetSessionService,
} from "./sessionService";
import { HTTPSTATUS } from "../config/http.config";
import { NotFoundException } from "../utils/ErrorTypes";
import { z } from "zod";

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
const getSession = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req?.sessionId;

  if (!sessionId) {
    throw new NotFoundException("Session ID is not found.Please Login again.");
  }

  const { user } = await GetSessionService(sessionId);

  return res.status(HTTPSTATUS.OK).json({
    message: "Session Retrieved Successfully",
    user,
  });
});
const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = z.string().parse(req.params.id);
  const userId = req.user?.id;

  if (!sessionId && !userId) {
    throw new NotFoundException("Not Found.");
  }

  await DeleteSessionService(sessionId, userId);

  return res.status(HTTPSTATUS.OK).json({
    message: "Session Deleted Successfully.",
  });
});

export { getAllSessions, getSession, deleteSession };
