import Message from "../models/message.js";
import { StatusCodes } from "http-status-codes";
import validator from "validator";

// post
export const postMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { content, storyId } = req.body;

    const result = await Message.create({
      userId,
      storyId,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "留言已成功建立",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "留言建立失敗",
    });
  }
};

// get
export const getMessage = async (req, res) => {
  try {
    const storyId = req.params.id;

    // 驗證 storyId 格式
    if (!validator.isMongoId(storyId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "無效的故事 ID",
      });
    }
    // console.log(storyId);

    const result = await Message.find({ storyId }).populate({
      path: "userId",
      select: "username avatar",
    });
    // console.log(result);

    if (!result.length) {
      // 如果沒有留言，返回 "尚未有留言" 的提示
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "尚未有留言",
        data: [], // 回傳空數組以表示沒有留言
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "留言讀取成功",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "讀取留言失敗",
      error: error.message,
    });
  }
};

// patch
export const patchMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { content } = req.body;

    // console.log("messageId 的值：", messageId);
    // console.log("req.body 的值：", req.body);
    // console.log("content 的值：", content);

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "編輯的留言不存在",
      });
    }

    message.content = content;

    await message.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "已成功編輯",
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "編輯留言失敗",
      error: error.message,
    });
  }
};

// delete
export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    // console.log("messageId 的值：", messageId);

    const deletedMessage = await Message.findByIdAndDelete(messageId);

    if (!deletedMessage) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "留言未找到",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "留言已成功刪除",
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "刪除留言失敗",
      error: error.message,
    });
  }
};
