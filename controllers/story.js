import Story from "../models/story.js";
import User from "../models/user.js";
import { StatusCodes } from "http-status-codes";
import validator from "validator";
import { getBookmarkedStories, BookmarkError } from "../services/bookmarkService.js";
import { finalizeVoting, ExtensionMergeError } from "../services/extensionMergeService.js";

// post
export const create = async (req, res) => {
  try {
    req.body.image = req.file.path;

    const result = await Story.create({
      mainAuthor: req.user._id,

      title: req.body.title,
      totalWordCount: req.body.totalWordCount || 0,
      chapters: req.body.chapters || 1,
      currentChapterWordCount: req.body.currentChapterWordCount || 0,
      wordsPerChapter: req.body.wordsPerChapter || 0, // 每章的字數限制，預設為0
      extendWordLimit: req.body.extendWordLimit || 0, // 延伸的字數限制，預設為0
      content: [
        {
          author: req.body.author,
          content: req.body.content,
          chapterName: req.body.chapterName,
          chapter: req.body.chapter || 1, // 章節號碼，預設為1
          voteCount: req.body.voteCount,
          parent: req.body.parent,
          main: req.body.main,
        },
      ],
      extensions: req.body.extensions || [],
      category: req.body.category,
      chapterLabels: req.body.chapterLabels || [],
      state: req.body.state || false, // 狀態，預設為false
      show: req.body.show ?? true, // 顯示狀態，預設為true
      image: req.body.image,
      voteTime: req.body.voteTime || 0, // 投票時間，預設為0
      views: req.body.views || 0, // 瀏覽次數，預設為0
      collectionNum: req.body.collectionNum, // 收藏次數，預設為0
      totalVotes: req.body.totalVotes || 0, // 總投票數，預設為0
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      result,
    });
  } catch (error) {
    console.log(error);
    if (error.name === "ValidationError") {
      const key = Object.keys(error.errors)[0];
      const message = error.errors[key].message;
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "未知錯誤",
      });
    }
  }
};

export const extendStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const { chapterName, content, voteCount } = req.body;
    const userId = req.user._id;

    const newExtension = {
      chapterName,
      content: [{ latestContent: content }],
      voteCount: voteCount || [],
      author: userId,
    };

    const story = await Story.findById(storyId);

    // 如果還沒有設置 voteStart，表示這是第一個延續故事
    if (story.extensions.length === 0) {
      const now = Date.now();
      story.voteStart = now;
      story.voteEnd = now + story.voteTime * 1; // 假設 voteTime 之前已經設置
    }

    story.extensions.push(newExtension);
    await story.save();
    const extensionId = story.extensions[story.extensions.length - 1]._id;

    // 在 User 模型中加入 extensionsHistory 記錄
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "使用者不存在" });
    }

    const newHistory = {
      storyId: storyId,
      content: content,
      voteCount: voteCount || [], // 默認為空陣列
      _id: extensionId,
    };

    user.extensionsHistory.push(newHistory);
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Story extension added successfully and recorded in user history.",
    });
  } catch (error) {
    console.log(error);
    if (error.name === "ValidationError") {
      const key = Object.keys(error.errors)[0];
      const message = error.errors[key].message;
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "未知錯誤",
      });
    }
  }
};

// get
export const get = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";
    const itemsPerPage = req.query.itemsPerPage * 1 || 10;
    const page = req.query.page * 1 || 1;

    const data = await Story.find({ show: true })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .populate("extensions.author", "username avatar")
      .populate("mainAuthor", "username avatar");

    const total = await Story.estimatedDocumentCount();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      result: {
        data,
        total,
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

export const getAll = async (req, res) => {
  try {
    const userId = req.user._id;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";
    const itemsPerPage = req.query.itemsPerPage * 1 || 10;
    const page = req.query.page * 1 || 1;

    // 只查詢所需的字段
    const filter = { mainAuthor: userId };
    const data = await Story.find(filter)
      .select(
        "title state show collectionNum followNum totalVotes image author category"
      ) // 只選取這些字段
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const total = await Story.estimatedDocumentCount();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      result: {
        data,
        total,
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

export const getId = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error("ID");

    const result = await Story.findById(req.params.id)
      .orFail(new Error("NOT FOUND"))
      .populate("mainAuthor", "username avatar")
      .populate("extensions.author", "username avatar");

    // 增加 views 計數
    result.views = (result.views || 0) + 1;
    await result.save(); // 保存更改
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      result,
    });
  } catch (error) {
    if (error.name === "CastError" || error.message === "ID") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "故事 ID 格式錯誤",
      });
    } else if (error.message === "NOT FOUND") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "查無故事",
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "未知錯誤",
      });
    }
  }
};

export const getBookmarkStories = async (req, res) => {
  try {
    const data = await getBookmarkedStories({ userId: req.user._id });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "收藏故事獲取成功",
      result: {
        data,
      },
    });
  } catch (error) {
    if (error instanceof BookmarkError) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "獲取收藏的故事時發生錯誤",
    });
  }
};

export const getPopularStories = async (req, res) => {
  try {
    const data = await Story.find({ show: true })
      .sort({ views: -1 }) // 根據 views 進行降序排序
      .limit(5) // 只返回前五個故事
      .populate("extensions.author", "username avatar") // 填充 extensions.author 的 username
      .populate("mainAuthor", "username avatar"); // 填充 mainAuthor 的 username

    res.status(StatusCodes.OK).json({
      success: true,
      message: "熱門故事獲取成功",
      result: {
        data,
      },
    });
  } catch (error) {
    console.error("Error fetching popular stories:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "無法獲取熱門故事",
      error: error.message,
    });
  }
};

export const getNewestStories = async (req, res) => {
  try {
    const data = await Story.find({ show: true })
      .sort({ createdAt: -1 }) // 根據 createdAt 進行降序排序
      .limit(5) // 只返回前五個
      .populate("extensions.author", "username avatar") // 填充 extensions.author 的 username
      .populate("mainAuthor", "username avatar"); // 填充 mainAuthor 的 username

    res.status(StatusCodes.OK).json({
      success: true,
      message: "最新故事獲取成功",
      result: {
        data,
      },
    });
  } catch (error) {
    console.error("Error fetching newest stories:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "無法獲取最新故事",
      error: error.message,
    });
  }
};

export const getCompletedStories = async (req, res) => {
  try {
    const data = await Story.find({ state: true, show: true })
      .populate("extensions.author", "username avatar") // 填充 extensions.author 的 username
      .populate("mainAuthor", "username avatar"); // 填充 mainAuthor 的 username; // 只返回已完結的故事
    res.status(StatusCodes.OK).json({
      success: true,
      message: "完結故事獲取成功",
      result: {
        data,
      },
    });
  } catch (error) {
    console.error("Error fetching newest stories:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "無法獲取完結故事",
      error: error.message,
    });
  }
};

// patch
export const edit = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error("ID");

    const story = await Story.findById(req.params.id).orFail(
      new Error("NOT FOUND")
    );

    if (story.mainAuthor.toString() !== req.user._id.toString()) {
      throw new Error("FORBIDDEN");
    }

    req.body.image = req.file?.path;
    await Story.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
    });
  } catch (error) {
    console.log(error);
    if (error.name === "CastError" || error.message === "ID") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "故事 ID 格式錯誤",
      });
    } else if (error.message === "NOT FOUND") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "查無故事",
      });
    } else if (error.message === "FORBIDDEN") {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "無權編輯此故事",
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
        message: "未知錯誤",
      });
    }
  }
};

// 投票時間到了之後，決定要清空延伸故事、合併進目前章節、還是開新章節——
// 這整套規則現在都在 services/extensionMergeService.js 裡，controller 只負責轉接。
export const finalizeStoryVoting = async (req, res) => {
  try {
    const result = await finalizeVoting({ storyId: req.params.id });
    res.status(200).json({
      success: true,
      message: "投票已結算",
      action: result.action,
      story: result.story,
      isCompleted: result.isCompleted ?? false,
    });
  } catch (error) {
    if (error instanceof ExtensionMergeError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error("結算投票時發生錯誤", error);
    res.status(500).json({ success: false, message: "結算投票時發生錯誤" });
  }
};

// delete
export const deleteId = async (req, res) => {
  try {
    // 使用 validator.isMongoId 來驗證請求參數中的故事 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error("ID");

    const story = await Story.findById(req.params.id).orFail(
      new Error("NOT FOUND")
    );

    if (story.mainAuthor.toString() !== req.user._id.toString()) {
      throw new Error("FORBIDDEN");
    }

    await story.deleteOne();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
    });
  } catch (error) {
    if (error.name === "CastError" || error.message === "ID") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "故事 ID 格式錯誤",
      });
    } else if (error.message === "NOT FOUND") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "查無故事",
      });
    } else if (error.message === "FORBIDDEN") {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "無權刪除此故事",
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
        message: "未知錯誤",
      });
    }
  }
};

export const deleteExtensionStory = async (req, res) => {
  const { storyId, extensionId } = req.params;

  try {
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "故事未找到" });
    }

    const extension = story.extensions.id(extensionId);
    if (!extension) {
      return res.status(404).json({ message: "延續故事未找到" });
    }

    if (extension.author?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "無權刪除此延續故事" });
    }

    const updatedStory = await Story.findByIdAndUpdate(
      storyId,
      { $pull: { extensions: { _id: extensionId } } },
      { new: true }
    );

    if (!updatedStory) {
      return res.status(404).json({ message: "更新故事失败" });
    }

    res.status(200).json({ message: "Extension story deleted successfully" });
  } catch (error) {
    console.error("Failed to delete extension story", error);
    res.status(500).json({ message: "Failed to delete extension story" });
  }
};
