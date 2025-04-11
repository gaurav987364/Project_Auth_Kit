import { Router } from "express";
import { authenticateJWT } from "../strategies/jwt-strategy";
import {
  createMFASetup,
  verifyMFASetup,
  revokeMFA,
  verifyMFALogin,
} from "../controllers/mfaController";

const mfaRoute = Router();

mfaRoute.get("/setup", authenticateJWT, createMFASetup);
mfaRoute.post("/verify", authenticateJWT, verifyMFASetup);
mfaRoute.put("/revoke", authenticateJWT, revokeMFA);
mfaRoute.post("/verify-login", verifyMFALogin);

export default mfaRoute;
