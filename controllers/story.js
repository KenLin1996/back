import Story from "../models/story.js";
import { StatusCodes } from "http-status-codes";
import validator from "validator";

// post
export const create = async (req, res) => {
  try {
    req.body.image = req.file.path;
    const now = Date.now();
    const result = await Story.create({
      mainAuthor: req.user._id,
      // supportAuthor: req.body.supportAuthor,
      title: req.body.title,
      chapterName: req.body.chapterName,
      totalWordCount: req.body.totalWordCount,
      content: [
        {
          author: req.body.author,
          content: req.body.content,
          chapterName: req.body.chapterName,
          voteCount: req.body.voteCount,
          parent: req.body.parent,
          main: req.body.main,
        },
      ],
      category: req.body.category,
      chapterLabels: req.body.chapterLabels,
      state: req.body.state,
      show: req.body.show,
      image: req.body.image,
      voteTime: req.body.voteTime,
      voteStart: now,
      voteEnd: now + req.body.voteTime * 1,
      views: req.body.views,
      collectionNum: req.body.collectionNum,
      followNum: req.body.followNum,
      totalVotes: req.body.totalVotes,
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
    console.log(req.body);
    const storyId = req.params.id;
    const { chapterName, content, voteCount } = req.body;
    const userId = req.user._id;

    // console.log("Received story extension request:", {
    //   storyId,
    //   chapterName,
    //   content,
    //   userId,
    // });

    const newExtension = {
      chapterName,
      content: [{ latestContent: content }],
      voteCount: voteCount,
      author: userId,
    };

    const story = await Story.findById(storyId);
    story.extensions.push(newExtension);

    await story.save();

    res
      .status(200)
      .json({ success: true, message: "Story extension added successfully." });
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

    // 只查詢所需的字段
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
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";
    const itemsPerPage = req.query.itemsPerPage * 1 || 10;
    const page = req.query.page * 1 || 1;

    // 只查詢所需的字段
    const data = await Story.find({})
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

    await story.save(); // 保存更新到數據庫

    res.status(200).json({ message: "Vote time updated successfully", story });
  } catch (error) {
    console.error("Failed to update vote time:", error);
    res.status(500).json({ message: "Failed to update vote time" });
  }
};

// export const updateVoteCount = async (req, res) => {
//   const { storyId, extensionId } = req.params;
//   const { voteCountChange } = req.body;

//   try {
//     // 查找指定的故事
//     const story = await Story.findById(storyId);
//     if (!story) {
//       return res.status(404).json({ message: "找不到故事" });
//     }

//     // 找到指定的擴展
//     const extidx = story.extensions.findIndex(
//       (ext) => ext._id.toString() === extensionId
//     );
//     if (extidx === -1) {
//       return res.status(404).json({ message: "找不到此延伸故事" });
//     }

//     // const hasVotedInOtherExtension = story.extensions.some((ext) =>
//     //   ext.voteCount.includes(req.user._id)
//     // );
//     const hasVotedInOtherExtension = story.extensions.some(
//       (ext) =>
//         ext.voteCount.includes(req.user._id) &&
//         ext._id.toString() !== extensionId
//     );

//     if (voteCountChange === 1) {
//       if (
//         !story.extensions[extidx].voteCount.includes(req.user._id) &&
//         !hasVotedInOtherExtension
//       ) {
//         story.extensions[extidx].voteCount.push(req.user._id);
//       }
//     } else if (voteCountChange === -1) {
//       const vidx = story.extensions[extidx].voteCount.findIndex(
//         (v) => v.toString() === req.user._id.toString()
//       );
//       if (vidx > -1) {
//         story.extensions[extidx].voteCount.splice(vidx, 1);
//       }
//     }

//     await story.save();
//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "已經成功投票",
//       hasVotedInOtherExtension,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

export const updateVoteCount = async (req, res) => {
  const { storyId, extensionId } = req.params;
  const { voteCountChange } = req.body;

  try {
    // 查找指定的故事
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "找不到故事" });
    }

    // 找到指定的扩展
    const extidx = story.extensions.findIndex(
      (ext) => ext._id.toString() === extensionId
    );
    if (extidx === -1) {
      return res.status(404).json({ message: "找不到此延伸故事" });
    }

    // 确认用户是否在其他扩展中投过票
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
    res.status(200).json({
      success: true,
      message: "已經成功投票",
      hasVotedInOtherExtension, // 这里返回的值根据逻辑动态设置
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// delete
export const deleteId = async (req, res) => {
  try {
    // 使用 validator.isMongoId 來驗證請求參數中的故事 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error("ID");
    // runValidators: true 確保更新時會執行模型中的驗證規則
    // orFail(new Error('NOT FOUND')) 如果找不到匹配的故事，會拋出一個 NOT FOUND 錯誤
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
