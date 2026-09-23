import { StatusCodes } from "http-status-codes";
import validator from "validator";
import {
  createMessage,
  getMessagesForStory,
  updateMessage,
  deleteMessage as deleteMessageService,
  MessageError,
} from "../services/messageService.js";

const handleMessageError = (res, error) => {
  if (error instanceof MessageError) {
    return res
      .status(error.status)
      .json({ success: false, message: error.message });
  }
  console.error(error);
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ success: false, message: "伺服器錯誤" });
};

// post
export const postMessage = async (req, res) => {
  try {
    const { content, storyId } = req.body;
    const result = await createMessage({
      userId: req.user._id,
      storyId,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "留言已成功建立",
      result,
    });
  } catch (error) {
    handleMessageError(res, error);
  }
};

// get
export const getMessage = async (req, res) => {
  try {
    const storyId = req.params.id;

    if (!validator.isMongoId(storyId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "無效的故事 ID",
      });
    }

    const result = await getMessagesForStory({ storyId });

    if (!result.length) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "尚未有留言",
        data: [],
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "留言讀取成功",
      data: result,
    });
  } catch (error) {
    handleMessageError(res, error);
  }
};

// patch
export const patchMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { content } = req.body;

    await updateMessage({ userId: req.user._id, messageId, content });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "已成功編輯",
    });
  } catch (error) {
    handleMessageError(res, error);
  }
};

// delete
export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;

    await deleteMessageService({ userId: req.user._id, messageId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "留言已成功刪除",
    });
  } catch (error) {
    handleMessageError(res, error);
  }
};
