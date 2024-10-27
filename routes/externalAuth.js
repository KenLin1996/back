import { Router } from "express";
import { googleAuthLog } from "../controllers/externalAuth.js";
import * as auth from "../middlewares/auth.js";

const router = Router();

router.get("/google", auth.googleAuth, googleAuthLog);

export default router;
