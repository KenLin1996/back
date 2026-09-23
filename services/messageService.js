import Message from "../models/message.js";

// 留言的商業邏輯：建立、讀取都不需要擁有權檢查（誰都能留言、誰都能看），
// 但編輯/刪除必須是留言本人才能做——這件事之前完全沒被檢查過，任何登入的
// 使用者都能改或刪別人的留言。跟故事那邊修過的漏洞是同一類問題。
export class MessageError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function createMessage({ userId, storyId, content }) {
  return Message.create({ userId, storyId, content });
}

export async function getMessagesForStory({ storyId }) {
  return Message.find({ storyId }).populate({
    path: "userId",
    select: "username avatar",
  });
}

export async function updateMessage({ userId, messageId, content }) {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new MessageError(404, "編輯的留言不存在");
  }
  if (message.userId.toString() !== userId.toString()) {
    throw new MessageError(403, "無權編輯此留言");
  }

  message.content = content;
  await message.save();
  return message;
}

export async function deleteMessage({ userId, messageId }) {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new MessageError(404, "留言未找到");
  }
  if (message.userId.toString() !== userId.toString()) {
    throw new MessageError(403, "無權刪除此留言");
  }

  await message.deleteOne();
  return message;
}
