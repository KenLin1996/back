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
  getBookmarkStories,
  getPopularStories,
  getNewestStories,
  getCompletedStories,
  edit,
  finalizeStoryVoting,
  deleteId,
  deleteExtensionStory,
} from "../controllers/story.js";

const router = Router();

router.post("/", auth.jwt, upload, create);
router.post("/:id", auth.jwt, extendStory);

router.get("/getBookmarkStories", auth.jwt, getBookmarkStories);
router.get("/getPopularStories", getPopularStories);
router.get("/getNewestStories", getNewestStories);
router.get("/getCompletedStories", getCompletedStories);
router.get("/", get);
router.get("/all", auth.jwt, getAll);
router.get("/:id", getId);

router.patch("/:id", auth.jwt, upload, edit);
router.patch("/:id/finalizeVoting", auth.jwt, finalizeStoryVoting);

router.delete("/:id", auth.jwt, deleteId);
router.delete(
  "/:storyId/:extensionId/deleteExtensionStory",
  auth.jwt,
  deleteExtensionStory
);

export default router;
