import User from "../models/user.js";
import Story from "../models/story.js";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// post
export const create = async (req, res) => {
  try {
    // 資料庫中建立新的使用者資料
    await User.create(req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const key = Object.keys(error.errors)[0];
      const message = errors.error[key].message;
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message,
      });
    } else if (error.name === "MongoServerError" && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "帳號已註冊",
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "未知錯誤",
      });
    }
  }
};

export const login = async (req, res) => {
  try {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7 days",
    });
    req.user.tokens.push(token);
    const userId = req.user._id;
    await req.user.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      result: {
        userId,
        token,
        email: req.user.email,
        username: req.user.username,
        theme: req.user.theme,
        bookmarkStory: req.user.bookmarkStory,
        followStory: req.user.followStory,
        voteStory: req.user.voteStory,
        createCharacters: req.user.createCharacters,
        notifies: req.user.notifies,
      },
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "未知錯誤",
    });
  }
};

export const addMark = async (req, res) => {
  try {
    const userId = req.user._id;
    const { storyId } = req.body;

    const user = await User.findById(userId).populate("bookmarkStory");
    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ message: "故事不存在" });
    }

    let hasCollection = false;
    if (user.bookmarkStory.some((book) => book.toString() === storyId)) {
      user.bookmarkStory = user.bookmarkStory.filter(
        (book) => book.toString() !== storyId
      );
      story.collectionNum = Math.max(0, story.collectionNum - 1);
    } else {
      user.bookmarkStory.push(storyId);
      story.collectionNum += 1;
      hasCollection = true;
    }

    await story.save();
    await user.save();
    res.json({
      hasCollection: user.bookmarkStory.some((book) => {
        return book.toString() === storyId;
      }),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

// patch
export const extend = async (req, res) => {
  try {
    const idx = req.user.tokens.findIndex((token) => token === req.token);
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7 days",
    });
    req.user.tokens[idx] = token;

    await req.user.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      result: token,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "未知錯誤",
    });
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updatedData = {};
    // 根據前端傳過來的值進行更新
    if (req.body.username) {
      updatedData.username = req.body.username;
    }

    if (req.body.password) {
      updatedData.password = await bcrypt.hash(req.body.password, 10);
    }

    if (req.body.email) {
      updatedData.email = req.body.email;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      throw new Error("NOT FOUND");
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "資料更新成功",
    });
  } catch (error) {
    // 錯誤處理邏輯
    if (error.name === "CastError" || error.message === "ID") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "使用者 ID 格式錯誤",
      });
    } else if (error.message === "NOT FOUND") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "找不到該使用者",
      });
    } else if (error.name === "ValidationError") {
      const key = Object.keys(error.errors)[0];
      const message = error.errors[key].message;
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "更新使用者資料失敗",
      });
    }
  }
};

// get
export const profile = (req, res) => {
  try {
    const userId = req.user._id;
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      result: {
        userId,
        avatar: req.user.avatar,
        email: req.user.email,
        username: req.user.username,
        theme: req.user.theme,
        bookmarkStory: req.user.bookmarkStory,
        followStory: req.user.followStory,
        voteStory: req.user.voteStory,
        createCharacters: req.user.createCharacters,
        notifies: req.user.notifies,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "未知錯誤",
    });
  }
};

export const getExtensionStory = async (req, res) => {
  try {
    const userId = req.user._id;

    // 使用 populate 取得 extensionsHistory 中的 storyId 資料
    const user = await User.findById(userId).populate({
      path: "extensionsHistory.storyId",
      select: "title state voteCount", // 只選取故事的書名和狀態
    });

    if (!user) {
      return res.status(404).json({ error: "使用者不存在" });
    }

    // 確保 storyId 被 populate 成功
    const historyData = user.extensionsHistory.map((extension) => {
      return {
        storyTitle: extension.storyId?.title || "故事已刪除", // 確保 storyId 存在
        storyState: extension.storyId?.state ? "完結" : "連載",
        extensionContent: extension.content,
      };
    });

    return res.status(200).json(historyData);
  } catch (error) {
    console.error("取得延續紀錄時發生錯誤:", error);
    return res.status(500).json({ error: "伺服器錯誤，請稍後再試" });
  }
};

export const checkBookmarkStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const storyId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户未找到" });
    }

    const hasCollection = user.bookmarkStory.includes(storyId);

    res.status(200).json({
      success: true,
      hasCollection: hasCollection,
    });
  } catch (error) {
    console.error("检查收藏状态失败", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

// delete
export const logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token != req.token);
    await req.user.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "未知錯誤",
    });
  }
};
