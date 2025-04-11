import SessionModel from "../database/models/sessionModel";
import { NotFoundException } from "../utils/ErrorTypes";

export const GetAllSessionService = async (userId: string) => {
  const sessions = await SessionModel.find(
    {
      userId,
      expiresAt: { $gt: Date.now() },
    },
    {
      _id: 1,
      userId: 1,
      userAgent: 1,
      createdAt: 1,
      expiresAt: 1,
    },
    {
      sort: {
        createdAt: -1,
      },
    }
  );
  return {
    sessions,
  };
};

export const GetSessionService = async (sessionId: string) => {
  const session = await SessionModel.findById(sessionId)
    .populate("userId")
    .select("-expiresAt");

  if (!session) {
    throw new NotFoundException("Session not found.");
  }

  const { userId: user } = session;
  return {
    user,
  };
};

export const DeleteSessionService = async (
  sessionId: string,
  userId: string
) => {
  const deleteSession = await SessionModel.findByIdAndDelete({
    _id: sessionId,
    userId: userId,
  });

  if (!deleteSession) {
    throw new NotFoundException("Session Not Found.");
  }
  return;
};
