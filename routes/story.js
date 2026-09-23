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

// TEMP DEBUG - 手動觸發排程掃描，確認完就會移除
router.get("/_debug/sweep", async (req, res) => {
  const { sweepExpiredVotes } = await import(
    "../services/extensionMergeService.js"
  );
  try {
    const StoryModel = (await import("../models/story.js")).default;
    const now = new Date();
    const all = await StoryModel.find({}).select("_id voteEnd extensions");
    const diag = all.map((s) => ({
      _id: s._id.toString(),
      extLen: s.extensions.length,
      voteEnd: s.voteEnd,
      isPast: s.voteEnd ? s.voteEnd < now : null,
    }));

    const results = await sweepExpiredVotes();
    res.json({ ok: true, now, totalStories: all.length, diag, results });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message, stack: error.stack });
  }
});

router.delete("/:id", deleteId);
router.delete(
  "/:storyId/:extensionId/deleteExtensionStory",
  deleteExtensionStory
);

export default router;
