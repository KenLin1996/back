import mongoose from "mongoose";
import Story from "../models/story.js";
import User from "../models/user.js";
import VoteRecord from "../models/VoteRecord.js";

// 投票是一個不可分割的業務動作：VoteRecord、Story.extensions[].voteCount、
// 投票者的 voteStory、延伸故事作者的 extensionsHistory 這四個地方要嘛一起更新，
// 要嘛都不更新——所以全部包在同一個 transaction 裡，不讓 controller/路由各自呼叫。
export class VoteError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const findAuthorExtension = (author, storyId, extensionId) =>
  author?.extensionsHistory.find(
    (ext) =>
      ext.storyId.toString() === storyId && ext._id.toString() === extensionId
  );

const loadStoryAndExtension = async (session, storyId, extensionId) => {
  const story = await Story.findById(storyId).session(session);
  if (!story) throw new VoteError(404, "找不到故事");

  const extension = story.extensions.id(extensionId);
  if (!extension) throw new VoteError(404, "找不到此延伸故事");

  return { story, extension };
};

// 投票人不一定是延伸故事的作者，所以要分開查兩個 User 文件；
// 如果剛好是同一人，就重用同一份 document instance，避免同一位使用者被存兩次時互相覆蓋。
const resolveVoterAndAuthor = async (session, userId, extension) => {
  const voter = await User.findById(userId).session(session);
  if (!voter) throw new VoteError(404, "找不到使用者");

  const authorId = extension.author?.toString();
  const author =
    authorId === userId.toString()
      ? voter
      : authorId
      ? await User.findById(authorId).session(session)
      : null;

  return { voter, author };
};

const saveVoterAndAuthor = async (session, voter, author) => {
  await voter.save({ session });
  if (author && author !== voter) {
    await author.save({ session });
  }
};

export async function castVote({ userId, storyId, extensionId, content, exAuthor }) {
  const session = await mongoose.startSession();
  try {
    let voteCount;
    await session.withTransaction(async () => {
      const { story, extension } = await loadStoryAndExtension(
        session,
        storyId,
        extensionId
      );

      const hasVotedInOtherExtension = story.extensions.some(
        (ext) =>
          ext.voteCount.includes(userId) && ext._id.toString() !== extensionId
      );
      if (hasVotedInOtherExtension) {
        throw new VoteError(409, "已經投票給同一個故事的其他延伸內容了");
      }

      const alreadyVoted = await VoteRecord.findOne({
        userId,
        storyId,
        extensionId,
      }).session(session);
      if (alreadyVoted) {
        throw new VoteError(409, "已經投過票了");
      }

      extension.voteCount.push(userId);
      await story.save({ session });

      await VoteRecord.create([{ userId, storyId, extensionId, exAuthor, content }], {
        session,
      });

      const { voter, author } = await resolveVoterAndAuthor(session, userId, extension);

      if (!voter.voteStory.includes(extensionId)) {
        voter.voteStory.push(extensionId);
      }
      const authorExtension = findAuthorExtension(author, storyId, extensionId);
      if (authorExtension && !authorExtension.voteCount.includes(userId)) {
        authorExtension.voteCount.push(userId);
      }

      await saveVoterAndAuthor(session, voter, author);

      voteCount = extension.voteCount.length;
    });
    return { voteCount };
  } finally {
    await session.endSession();
  }
}

export async function retractVote({ userId, storyId, extensionId }) {
  const session = await mongoose.startSession();
  try {
    let voteCount;
    await session.withTransaction(async () => {
      const { story, extension } = await loadStoryAndExtension(
        session,
        storyId,
        extensionId
      );

      const deletedRecord = await VoteRecord.findOneAndDelete({
        userId,
        storyId,
        extensionId,
      }).session(session);
      if (!deletedRecord) {
        throw new VoteError(404, "投票紀錄未找到");
      }

      const vidx = extension.voteCount.findIndex(
        (v) => v.toString() === userId.toString()
      );
      if (vidx > -1) {
        extension.voteCount.splice(vidx, 1);
      }
      await story.save({ session });

      const { voter, author } = await resolveVoterAndAuthor(session, userId, extension);

      const idx = voter.voteStory.findIndex(
        (v) => v.toString() === extensionId.toString()
      );
      if (idx > -1) {
        voter.voteStory.splice(idx, 1);
      }
      const authorExtension = findAuthorExtension(author, storyId, extensionId);
      if (authorExtension) {
        const avidx = authorExtension.voteCount.findIndex(
          (v) => v.toString() === userId.toString()
        );
        if (avidx > -1) {
          authorExtension.voteCount.splice(avidx, 1);
        }
      }

      await saveVoterAndAuthor(session, voter, author);

      voteCount = extension.voteCount.length;
    });
    return { voteCount };
  } finally {
    await session.endSession();
  }
}

// 給 management.vue「已投票的故事」列表用——那邊手上只有 VoteRecord 自己的 _id，
// 沒有 storyId/extensionId，所以先反查一次，再走同一套 retractVote 邏輯，
// 確保無論從哪個畫面取消投票，都會同步更新 Story 的票數。
export async function retractVoteByRecordId({ userId, recordId }) {
  const record = await VoteRecord.findOne({ _id: recordId, userId });
  if (!record) {
    throw new VoteError(404, "投票紀錄未找到");
  }
  return retractVote({
    userId,
    storyId: record.storyId.toString(),
    extensionId: record.extensionId.toString(),
  });
}
