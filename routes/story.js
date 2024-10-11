import { Router } from "express";
import * as auth from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
// import admin from "../middlewares/admin.js";

import {
  create,
  extendStory,
  createNewChapter,
  get,
  getAll,
  getId,
  getBookmarkStories,
  getPopularStories,
  getNewestStories,
  getCompletedStories,
  edit,
  updateVoteCount,
  clearExtensions,
  mergeHighestVotedStory,
  deleteId,
  deleteExtensionStory,
} from "../controllers/story.js";

const router = Router();

router.post("/", auth.jwt, upload, create);
router.post("/:id", auth.jwt, extendStory);
router.post("/:id/newChapter", auth.jwt, createNewChapter);

router.get("/getBookmarkStories", auth.jwt, getBookmarkStories);
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
router.delete(
  "/:storyId/:extensionId/deleteExtensionStory",
  deleteExtensionStory
);

export default router;
