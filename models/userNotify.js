import { Schema } from "mongoose";

const UserNotifySchema = new Schema({
  type: {
    type: String,
    required: [true, "通知類型必填"],
  },
  text: {
    type: String,
    required: [true, "通知內容必填"],
  },
  read: {
    type: Boolean,
    required: [true, "通知讀取狀態必填"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: [true, "通知創建時間必填"],
  },
});

export default UserNotifySchema;
