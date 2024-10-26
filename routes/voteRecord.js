import { Router } from "express";
import {
  postVoteRec,
  checkVoteRec,
  getVoteStories,
  delVoteRec,
} from "../controllers/voteRecord.js";
import * as auth from "../middlewares/auth.js";

const router = Router();

router.post("/postVoteRec/:storyId/:extensionId", auth.jwt, postVoteRec);

router.get("/:storyId/:extensionId", auth.jwt, checkVoteRec);
router.get("/getVoteStories", auth.jwt, getVoteStories);

// 根據 id 刪除投票紀錄
router.delete("/delVoteRec/:id", auth.jwt, delVoteRec);
// 根據 storyId 和 extensionId 刪除投票紀錄
router.delete("/delVoteRec/:storyId/:extensionId", auth.jwt, delVoteRec);

export default router;
