import { Schema, model } from "mongoose";

const MessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" }, // 留言的使用者
    storyId: { type: Schema.Types.ObjectId, ref: "Story" }, // 被留言的故事
    content: {
      type: String,
      require: [true, "留言內容必填"],
    }, // 留言的內容
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model("Message", MessageSchema);
