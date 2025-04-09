import mongoose, { Document } from "mongoose";
import { ThirtyDaysFromNow } from "../../utils/helper";

export interface SessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new mongoose.Schema<SessionDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  userAgent: { type: String, required: false },
  expiresAt: { type: Date, required: true, default: ThirtyDaysFromNow },
  createdAt: { type: Date, default: Date.now },
});

const SessionModel = mongoose.model<SessionDocument>("Session", sessionSchema);

export default SessionModel;
