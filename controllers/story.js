import Story from "../models/story.js";
import User from "../models/user.js";
import { StatusCodes } from "http-status-codes";
import validator from "validator";

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
      show: req.body.show || true, // 顯示狀態，預設為true
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

export const createNewChapter = async (req, res) => {
  console.log(req.body);

  const storyId = req.params.id;
  const { newContent, newChapterName } = req.body;

  try {
    const story = await Story.findOne({ _id: storyId });

    if (!story) {
      return res.status(404).json({ message: "故事未找到" });
    }

    // 計算新的 currentChapterWordCount
    const newWordCount = newContent.length;

    // 檢查是否需要換新章節
    const shouldCreateNewChapter =
      story.currentChapterWordCount + newWordCount > story.wordsPerChapter;

    if (shouldCreateNewChapter) {
      // 新章節資料
      const newChapter = {
        content: [newContent],
        chapterName: newChapterName || "",
        chapter: story.content[story.content.length - 1].chapter + 1, // 新章節編號
        voteCount: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 更新故事的章節數量和內容
      const updatedStory = await Story.findOneAndUpdate(
        { _id: storyId },
        {
          $push: { content: newChapter },
          $set: {
            currentChapterWordCount: newWordCount,
          },
        },
        { new: true } // 返回更新後的文檔
      );

      if (!updatedStory) {
        return res.status(404).json({ message: "主故事更新失敗" });
      }

      // 清空 extensions 陣列
      await Story.findOneAndUpdate(
        { _id: updatedStory._id },
        { $set: { extensions: [] } },
        { new: true }
      );

      res
        .status(200)
        .json({ message: "新章節已成功創建", story: updatedStory });
    } else {
      res.status(400).json({ message: "目前不需要換新章節" });
    }
  } catch (error) {
    console.error("創建新章節時發生錯誤", error);
    res
      .status(500)
      .json({ message: "創建新章節時發生錯誤", error: error.message });
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
      .populate("extensions.author", "username")
      .populate("mainAuthor", "username");

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
      .populate("mainAuthor", "username");

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
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: "bookmarkStory",
      model: "Story",
      populate: [
        { path: "extensions.author", select: "username" },
        { path: "mainAuthor", select: "username" },
      ],
    });
    const data = user.bookmarkStory.flat();

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "用户未找到",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "收藏故事獲取成功",
      result: {
        data,
      },
    });
  } catch (error) {
    console.log(error);
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
      .populate("extensions.author", "username") // 填充 extensions.author 的 username
      .populate("mainAuthor", "username"); // 填充 mainAuthor 的 username

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
      .populate("extensions.author", "username") // 填充 extensions.author 的 username
      .populate("mainAuthor", "username"); // 填充 mainAuthor 的 username

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
      .populate("extensions.author", "username") // 填充 extensions.author 的 username
      .populate("mainAuthor", "username"); // 填充 mainAuthor 的 username; // 只返回已完結的故事
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
    req.body.image = req.file?.path;
    await Story.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
    }).orFail(new Error("NOT FOUND"));

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

export const updateVoteTime = async (req, res) => {
  const storyId = req.params.id;
  const { voteStart, voteEnd } = req.body;
  console.log(req.body);
  console.log(req.params.id);
  try {
    // 檢查故事是否存在
    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // 更新故事的投票時間
    story.voteStart = voteStart;
    story.voteEnd = voteEnd;

    await story.save(); // 保存更新到資料庫

    res.status(200).json({ message: "Vote time updated successfully", story });
  } catch (error) {
    console.error("Failed to update vote time:", error);
    res.status(500).json({ message: "Failed to update vote time" });
  }
};

export const updateVoteCount = async (req, res) => {
  const { storyId, extensionId } = req.params;
  const { voteCountChange } = req.body;

  try {
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "找不到故事" });
    }

    const extidx = story.extensions.findIndex(
      (ext) => ext._id.toString() === extensionId
    );

    if (extidx === -1) {
      return res.status(404).json({ message: "找不到此延伸故事" });
    }

    const hasVotedInOtherExtension = story.extensions.some(
      (ext) =>
        ext.voteCount.includes(req.user._id) &&
        ext._id.toString() !== extensionId
    );

    if (voteCountChange === 1) {
      if (
        !story.extensions[extidx].voteCount.includes(req.user._id) &&
        !hasVotedInOtherExtension
      ) {
        story.extensions[extidx].voteCount.push(req.user._id);
      }
    } else if (voteCountChange === -1) {
      const vidx = story.extensions[extidx].voteCount.findIndex(
        (v) => v.toString() === req.user._id.toString()
      );
      if (vidx > -1) {
        story.extensions[extidx].voteCount.splice(vidx, 1);
      }
    }

    await story.save();

    // 查找並更新 user 的 voteCount
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "找不到使用者" });
    }

    // 查找 extensionsHistory
    const userExtension = user.extensionsHistory.find(
      (ext) =>
        ext.storyId.toString() === storyId && ext._id.toString() === extensionId
    );

    // 驗證是否找到正確的
    if (!userExtension) {
      console.log("找不到對應的 userExtension");
      return res.status(404).json({ message: "找不到對應的使用者擴展記錄" });
    }

    // 檢查並更新 user 的 voteCount
    if (voteCountChange === 1 && !hasVotedInOtherExtension) {
      if (!userExtension.voteCount.includes(req.user._id)) {
        userExtension.voteCount.push(req.user._id);
      }
    } else if (voteCountChange === -1) {
      const vidx = userExtension.voteCount.findIndex(
        (v) => v.toString() === req.user._id.toString()
      );
      if (vidx > -1) {
        userExtension.voteCount.splice(vidx, 1);
      }
    }

    // 保存 user 的更新
    await user.save();

    res.status(200).json({
      success: true,
      message: "已經成功投票",
      hasVotedInOtherExtension,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "服務器錯誤" });
  }
};

export const clearExtensions = async (req, res) => {
  const storyId = req.params.id;

  try {
    const story = await Story.findById(storyId); // 確保獲取最新版本

    if (!story) {
      return res.status(404).json({ message: "故事未找到" });
    }

    // 確保在更新之前獲得最新的版本
    const updatedStory = await Story.findOneAndUpdate(
      { _id: storyId },
      { $set: { extensions: [] } },
      { new: true } // 返回更新後的文檔
    );

    if (!updatedStory) {
      return res.status(404).json({ message: "故事未找到" });
    }

    res
      .status(200)
      .json({ message: "延續故事已成功清空", story: updatedStory });
  } catch (error) {
    console.error("清空延續故事時發生錯誤", error);
    res
      .status(500)
      .json({ message: "清空延續故事時發生錯誤", error: error.message });
  }
};

export const mergeHighestVotedStory = async (req, res) => {
  const storyId = req.params.id;
  const { extensionsId } = req.body;

  try {
    const story = await Story.findOne({ _id: storyId });

    if (!story) {
      return res.status(404).json({ message: "故事未找到" });
    }

    const extension = story.extensions.id(extensionsId);

    if (!extension) {
      return res.status(404).json({ message: "延續故事未找到" });
    }

    // 獲取最新內容
    const addLatestContent = extension.content[0]?.latestContent;

    if (story.content.length > 0) {
      const lastChapter = story.content[story.content.length - 1];
      const exists = story.content[0].content.some(
        (contentItem) => contentItem === addLatestContent
      );

      if (!exists) {
        // 計算新的 currentChapterWordCount
        const newWordCount = (addLatestContent || "").length;
        const newCurrentChapterWordCount =
          story.currentChapterWordCount + newWordCount;

        // 計算剩餘字數
        const remainingWords =
          story.totalWordCount -
          (story.content.reduce(
            (sum, chapter) => sum + chapter.content.join("").length,
            0
          ) +
            newWordCount);

        // 更新狀態
        const updateFields = {
          $push: { "content.$.content": addLatestContent },
          $set: {
            hasMerged: true,
            currentChapterWordCount: newCurrentChapterWordCount,
          },
        };

        // 如果剩餘字數為 0，將狀態更改為完結
        if (remainingWords <= 0) {
          updateFields.$set.state = true;
        }

        // 使用 findOneAndUpdate 以避免版本錯誤
        const updatedStory = await Story.findOneAndUpdate(
          {
            _id: storyId,
            "content._id": lastChapter._id,
          },
          updateFields,
          { new: true } // 返回更新後的文檔
        );

        if (!updatedStory) {
          return res.status(404).json({ message: "主故事更新失敗" });
        }

        // 清空 extensions 陣列
        await Story.findOneAndUpdate(
          { _id: updatedStory._id },
          { $set: { extensions: [] } },
          { new: true }
        );

        res.status(200).json({
          message: "延續故事已合併到主故事中",
          story: updatedStory,
          isCompleted: remainingWords <= 0,
        });
      } else {
        res.status(200).json({ message: "延續故事已合併到主故事中", story });
      }
    } else {
      res.status(400).json({ message: "主故事內容不存在" });
    }
  } catch (error) {
    console.error("合併延續故事時發生錯誤", error);
    res
      .status(500)
      .json({ message: "合併延續故事時發生錯誤", error: error.message });
  }
};

// delete
export const deleteId = async (req, res) => {
  try {
    // 使用 validator.isMongoId 來驗證請求參數中的故事 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error("ID");

    await Story.findByIdAndDelete(req.params.id).orFail(new Error("NOT FOUND"));

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
