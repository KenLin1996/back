import VoteRecord from "../models/VoteRecord.js";
import { StatusCodes } from "http-status-codes";

// post
export const postVoteRec = async (req, res) => {
  try {
    const { storyId, extensionId } = req.params;
    const { content, exAuthor } = req.body;
    const userId = req.user._id;

    const voteRecord = await VoteRecord.create({
      userId,
      storyId,
      extensionId,
      exAuthor,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      voteRecord,
    });
  } catch (error) {
    console.log(error);
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
    console.log(error);
  }
};

export const checkVoteRec = async (req, res) => {
  try {
    const { storyId, extensionId } = req.params;
    const userId = req.user._id;

    const voteRecord = await VoteRecord.findOne({
      userId,
      storyId,
      extensionId,
    });

    if (voteRecord) {
      // 投票紀錄存在
      return res.status(StatusCodes.OK).json({ exists: true });
    } else {
      // 投票紀錄不存在
      return res.status(StatusCodes.OK).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking vote record:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "伺服器錯誤，無法檢查投票紀錄",
    });
  }
};

// delete

export const delVoteRec = async (req, res) => {
  const { storyId, extensionId, id } = req.params; // 檢查是否有傳入 id 或 storyId/extensionId
  const userId = req.user.id; // 假設你有存取用戶 ID 的機制

  try {
    let result;

    if (id) {
      // 如果有 id，則根據 id 和 userId 刪除紀錄
      result = await VoteRecord.findOneAndDelete({
        _id: id,
        userId,
      });
    } else if (storyId && extensionId) {
      // 否則根據 storyId 和 extensionId 刪除
      result = await VoteRecord.findOneAndDelete({
        storyId,
        extensionId,
        userId,
      });
    } else {
      return res.status(400).json({ message: "缺少必要的參數" });
    }

    if (!result) {
      return res.status(404).json({ message: "投票紀錄未找到" });
    }

    return res.status(200).json({ message: "投票紀錄已成功刪除" });
  } catch (error) {
    console.error("刪除投票紀錄時發生錯誤:", error);
    return res.status(500).json({ message: "伺服器錯誤" });
  }
};
