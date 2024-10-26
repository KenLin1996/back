import { Router } from "express";
import {
  postMessage,
  getMessage,
  patchMessage,
  deleteMessage,
} from "../controllers/message.js";
import * as auth from "../middlewares/auth.js";

const router = Router();

router.post("/", auth.jwt, postMessage);

router.get("/:id", getMessage);

router.patch("/:id", auth.jwt, patchMessage);

router.delete("/:id", auth.jwt, deleteMessage);

export default router;
