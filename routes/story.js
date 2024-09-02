import { Router } from "express";
import * as auth from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
// import admin from "../middlewares/admin.js";
import {
  create,
  extendStory,
  get,
  getAll,
  getId,
  getExtensionStory,
  edit,
  updateVoteTime,
  updateVoteCount,
  deleteId,
} from "../controllers/story.js";

const router = Router();

router.post("/", auth.jwt, upload, create);
router.post("/:id", auth.jwt, extendStory);

router.get("/", get);
router.get("/all", auth.jwt, getAll);
router.get("/:id", getId);
router.get("/getExtension/:storyId", auth.jwt, getExtensionStory);

router.patch("/:id", auth.jwt, upload, edit);
router.patch("/:id/updateVoteTime", auth.jwt, updateVoteTime);
router.patch("/:storyId/:extensionId", auth.jwt, updateVoteCount);

router.delete("/:id", deleteId);

export default router;
