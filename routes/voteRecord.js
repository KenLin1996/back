import { Router } from "express";
import {
  postVoteRec,
  checkVoteRec,
  getVoteStories,
  delVoteRec,
  delVoteRecById,
} from "../controllers/VoteRecord.js";
import * as auth from "../middlewares/auth.js";

const router = Router();

router.get("/getVoteStories", auth.jwt, getVoteStories);

// 依紀錄 id 刪除（「已投票的故事」管理頁面用）——要放在 /:storyId/:extensionId 之前，
// 不然會被那個通用的兩段式路徑攔截
router.delete("/delVoteRec/:id", auth.jwt, delVoteRecById);

router.post("/:storyId/:extensionId", auth.jwt, postVoteRec);
router.get("/:storyId/:extensionId", auth.jwt, checkVoteRec);
router.delete("/:storyId/:extensionId", auth.jwt, delVoteRec);

export default router;
