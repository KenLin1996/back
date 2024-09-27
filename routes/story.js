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
  getPopularStories,
  getNewestStories,
  getCompletedStories,
  edit,
  updateVoteCount,
  clearExtensions,
  mergeHighestVotedStory,
  deleteId,
} from "../controllers/story.js";

const router = Router();

router.post("/", auth.jwt, upload, create);
router.post("/:id", auth.jwt, extendStory);

router.get("/getPopularStories", getPopularStories);
router.get("/getNewestStories", getNewestStories);
router.get("/getCompletedStories", getCompletedStories);
router.get("/", get);
router.get("/all", auth.jwt, getAll);
router.get("/:id", getId);

router.patch("/:id", auth.jwt, upload, edit);
router.patch("/:id/clearExtensions", auth.jwt, clearExtensions);
router.patch("/:id/merge", auth.jwt, mergeHighestVotedStory);
router.patch("/:storyId/:extensionId", auth.jwt, updateVoteCount);

router.delete("/:id", deleteId);

export default router;
