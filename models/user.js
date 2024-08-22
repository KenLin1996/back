import { Schema, model } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import UserNotifySchema from "./userNotify.js";

const UserSchema = new Schema({
  avatar: {
    type: String,
    default() {
      return;
    },
  },
  email: {
    type: String,
    required: [true, "使用者信箱必填"],
    unique: true,
    validate: {
      validator(value) {
        return validator.isEmail(value);
      },
      message: "使用者信箱格式錯誤",
    },
  },
  username: {
    type: String,
    required: [true, "使用者暱稱必填"],
    minlength: [1, "使用者暱稱長度不符"],
    maxlength: [20, "使用者暱稱長度不符"],
    unique: true,
    validate: {
      validator(value) {
        return validator.isAlphanumeric(value);
      },
      message: "使用者帳號格式錯誤",
    },
  },
  password: {
    type: String,
    required: [true, "使用者密碼必填"],
  },
  tokens: {
    type: [String],
  },
  bookmarkStory: [
    {
      type: [Schema.Types.ObjectId],
      ref: "Story",
    },
  ],
  followStory: [
    {
      type: [Schema.Types.ObjectId],
      ref: "Story",
    },
  ],
  voteStory: [
    {
      type: [Schema.Types.ObjectId],
      ref: "Story",
    },
  ],
  createCharacters: [
    {
      type: [Schema.Types.ObjectId],
      ref: "Character",
    },
  ],
  notifies: [UserNotifySchema],
  theme: String,
});

UserSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    if (user.password.length < 4 || user.password.length > 20) {
      const error = new Error.ValidationError();
      error.addError(
        "password",
        new Error.ValidatorError({ message: "使用者密碼長度不符" })
      );
      next(error);
      return;
    } else {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
  next();
});

export default model("User", UserSchema);
