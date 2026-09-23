import { StatusCodes } from "http-status-codes";
import VoteRecord from "../models/VoteRecord.js";
import { castVote, retractVote, retractVoteByRecordId, VoteError } from "../services/voteService.js";

const handleVoteError = (res, error) => {
  if (error instanceof VoteError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(error);
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ success: false, message: "伺服器錯誤" });
};

// post：投票（同時建立 VoteRecord、更新故事票數、更新作者統計）
export const postVoteRec = async (req, res) => {
  try {
    const { storyId, extensionId } = req.params;
    const { content, exAuthor } = req.body;

    const { voteCount } = await castVote({
      userId: req.user._id,
      storyId,
      extensionId,
      content,
      exAuthor,
    });

    res.status(StatusCodes.OK).json({ success: true, message: "投票成功", voteCount });
  } catch (error) {
    handleVoteError(res, error);
  }
};

// get
export const getVoteStories = async (req, res) => {
  try {
    const userId = req.user._id;

    const voteRecords = await VoteRecord.find({ userId })
      .select("exAuthor content")
      .populate("storyId", "title");

    const voteStoryData = voteRecords.map((record) => ({
      id: record._id,
      exAuthor: record.exAuthor,
      content: record.content,
      storyTitle: record.storyId.title,
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      message: "收藏故事獲取成功",
      voteStories: voteStoryData,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "伺服器錯誤",
    });
  }
};

export const checkVoteRec = async (req, res) => {
  try {
    const { storyId, extensionId } = req.params;
    const userId = req.user._id;

    const voteRecord = await VoteRecord.findOne({ userId, storyId, extensionId });

    return res.status(StatusCodes.OK).json({ exists: !!voteRecord });
  } catch (error) {
    console.error("Error checking vote record:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "伺服器錯誤，無法檢查投票紀錄",
    });
  }
};

// delete：取消投票（依 storyId/extensionId，同時同步更新故事票數）
export const delVoteRec = async (req, res) => {
  try {
    const { storyId, extensionId } = req.params;

    const { voteCount } = await retractVote({
      userId: req.user._id,
      storyId,
      extensionId,
    });

    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "投票紀錄已成功刪除", voteCount });
  } catch (error) {
    handleVoteError(res, error);
  }
};

// delete：取消投票（依「已投票的故事」管理頁面手上的 VoteRecord id，同樣同步更新故事票數）
export const delVoteRecById = async (req, res) => {
  try {
    const { id } = req.params;

    const { voteCount } = await retractVoteByRecordId({
      userId: req.user._id,
      recordId: id,
    });

    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "投票紀錄已成功刪除", voteCount });
  } catch (error) {
    handleVoteError(res, error);
  }
};
