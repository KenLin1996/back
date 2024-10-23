import { Schema, model } from "mongoose";

const VoteRecordSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" }, // 投票的使用者
  storyId: { type: Schema.Types.ObjectId, ref: "Story" }, // 被投票的故事
  extensionId: { type: Schema.Types.ObjectId },
  exAuthor: String,
  content: String, // 延伸故事的內容
  voteDate: { type: Date, default: Date.now }, // 投票日期
});

// 建立索引
VoteRecordSchema.index({ storyId: 1, extensionId: 1 });

export default model("VoteRecord", VoteRecordSchema);
