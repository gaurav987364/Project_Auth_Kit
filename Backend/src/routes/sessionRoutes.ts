import { Router } from "express";
import {
  deleteSession,
  getAllSessions,
  getSession,
} from "../controllers/sessionController";

const sessionRoutes = Router();

sessionRoutes.get("/all", getAllSessions);
sessionRoutes.get("/", getSession);
sessionRoutes.delete("/:id", deleteSession);

export default sessionRoutes;
