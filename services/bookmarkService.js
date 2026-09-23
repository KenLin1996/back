import mongoose from "mongoose";
import Story from "../models/story.js";
import User from "../models/user.js";

// 收藏／取消收藏是同一個開關動作：User.bookmarkStory 和 Story.collectionNum
// 這兩處要嘛一起變、要嘛都不變，跟投票是同一類問題，所以一樣包成 transaction，
// 不讓呼叫方（controller、前端）自己負責兩邊都要記得改。
export class BookmarkError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function toggleBookmark({ userId, storyId }) {
  const session = await mongoose.startSession();
  try {
    let hasCollection;
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) throw new BookmarkError(404, "使用者不存在");

      const story = await Story.findById(storyId).session(session);
      if (!story) throw new BookmarkError(404, "故事不存在");

      const idx = user.bookmarkStory.findIndex(
        (id) => id.toString() === storyId
      );

      if (idx > -1) {
        user.bookmarkStory.splice(idx, 1);
        story.collectionNum = Math.max(0, story.collectionNum - 1);
        hasCollection = false;
      } else {
        user.bookmarkStory.push(storyId);
        story.collectionNum += 1;
        hasCollection = true;
      }

      await user.save({ session });
      await story.save({ session });
    });
    return { hasCollection };
  } finally {
    await session.endSession();
  }
}

// management.vue「已收藏的故事」列表一次可以勾多筆取消收藏，
// 逐一處理但仍包在同一個 transaction：要嘛全部套用，要嘛都不套用。
export async function removeBookmarks({ userId, storyIds }) {
  const session = await mongoose.startSession();
  try {
    const notFoundStoryIds = [];
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) throw new BookmarkError(404, "使用者不存在");

      for (const storyId of storyIds) {
        const story = await Story.findById(storyId).session(session);
        if (!story) {
          notFoundStoryIds.push(storyId);
          continue;
        }

        const idx = user.bookmarkStory.findIndex(
          (id) => id.toString() === storyId
        );
        if (idx > -1) {
          user.bookmarkStory.splice(idx, 1);
          story.collectionNum = Math.max(0, story.collectionNum - 1);
          await story.save({ session });
        }
      }

      await user.save({ session });
    });
    return { notFoundStoryIds };
  } finally {
    await session.endSession();
  }
}

export async function isBookmarked({ userId, storyId }) {
  const user = await User.findById(userId);
  if (!user) throw new BookmarkError(404, "使用者不存在");
  return user.bookmarkStory.some((id) => id.toString() === storyId);
}

export async function getBookmarkedStories({ userId }) {
  const user = await User.findById(userId).populate({
    path: "bookmarkStory",
    model: "Story",
    populate: [
      { path: "extensions.author", select: "username avatar" },
      { path: "mainAuthor", select: "username avatar" },
    ],
  });
  if (!user) throw new BookmarkError(404, "使用者不存在");
  return user.bookmarkStory.flat();
}
