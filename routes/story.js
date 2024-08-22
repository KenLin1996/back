import { Router } from "express";
import * as auth from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
// import admin from "../middlewares/admin.js";
import {
  create,
  extendStory,
  getAll,
  edit,
  get,
  getId,
  deleteId,
  updateVoteTime,
} from "../controllers/story.js";

const router = Router();

router.post("/", auth.jwt, upload, create);
router.post("/:id", auth.jwt, extendStory);
router.get("/", get);
// router.get("/all", auth.jwt, admin, getAll);
router.get("/all", auth.jwt, getAll);
router.get("/:id", getId);

router.patch("/:id", auth.jwt, upload, edit);
router.patch("/:id/startVote", auth.jwt, updateVoteTime);
router.delete("/:id", deleteId);

export default router;
