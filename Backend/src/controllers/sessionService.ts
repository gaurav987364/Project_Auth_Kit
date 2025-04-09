import SessionModel from "../database/models/sessionModel";

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
