import mongoose from "mongoose";
import Story from "../models/story.js";

// 「投票結束後決定怎麼處理延伸故事」是一個完整的業務規則，原本被拆成三支獨立
// endpoint（clearExtensions / merge / newChapter），由前端自己讀 extensions、算
// 最高票、判斷章節滿不滿，再決定呼叫哪一支——這代表規則其實寫在 Vue 元件裡，
// 後端只是被動執行前端算好的結果，而且兩邊各自判斷「要不要開新章節」的條件還不一樣。
//
// 現在收斂成一支 finalizeVoting()：丟 storyId 進來，其餘（沒人投票就清空、
// 選出最高票、章節滿了要不要開新章節、要不要完結）全部由後端決定並在同一個
// transaction 裡完成。前端不用再自己判斷，也不可能出現「前端判斷跟後端判斷
// 不一致」的情況。
export class ExtensionMergeError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function finalizeVoting({ storyId }) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const story = await Story.findById(storyId).session(session);
      if (!story) throw new ExtensionMergeError(404, "故事未找到");

      if (story.extensions.length === 0) {
        result = { action: "noop" };
        return;
      }

      const validExtensions = story.extensions.filter(
        (ext) => ext.voteCount.length > 0
      );

      if (validExtensions.length === 0) {
        story.extensions = [];
        await story.save({ session });
        result = { action: "cleared" };
        return;
      }

      // 最高票；同票時取先出現的那個（跟原本前端的 reduce 邏輯一致）
      const winner = validExtensions.reduce((prev, current) =>
        current.voteCount.length > prev.voteCount.length ? current : prev
      );

      const newContent = winner.content[0]?.latestContent || "";
      const newWordCount = newContent.length;

      if (story.content.length === 0) {
        throw new ExtensionMergeError(400, "主故事內容不存在");
      }

      const lastChapter = story.content[story.content.length - 1];
      const alreadyMerged = lastChapter.content.includes(newContent);

      if (alreadyMerged) {
        // 已經合併過了（例如同時有兩個請求進來，第二個在這裡發現已經做過了）
        story.extensions = [];
        await story.save({ session });
        result = { action: "already_merged", story };
        return;
      }

      const shouldCreateNewChapter =
        story.currentChapterWordCount + newWordCount > story.wordsPerChapter;

      if (shouldCreateNewChapter) {
        story.content.push({
          content: [newContent],
          chapterName: winner.chapterName || "",
          chapter: lastChapter.chapter + 1,
          voteCount: [],
        });
        story.currentChapterWordCount = newWordCount;
        story.totalVotes += winner.voteCount.length;
        story.extensions = [];
        await story.save({ session });

        result = { action: "newChapter", story, isCompleted: false };
      } else {
        lastChapter.content.push(newContent);
        lastChapter.voteCount.push(...winner.voteCount);
        story.currentChapterWordCount += newWordCount;
        story.totalVotes += winner.voteCount.length;

        const writtenWords = story.content.reduce(
          (sum, chapter) => sum + chapter.content.join("").length,
          0
        );
        const isCompleted = writtenWords >= story.totalWordCount;
        if (isCompleted) {
          story.state = true;
        }

        story.hasMerged = true;
        story.extensions = [];
        await story.save({ session });

        result = { action: "merged", story, isCompleted };
      }
    });
    return result;
  } finally {
    await session.endSession();
  }
}

// 定期掃描「投票時間已經過期、但延伸故事還沒被處理」的故事，主動幫它們結算。
// 這樣 finalizeVoting 就不再需要依賴剛好有使用者打開該故事的頁面才會被觸發。
// 每個故事各自 try/catch，避免其中一個失敗就讓整批掃描中斷。
export async function sweepExpiredVotes() {
  // 不管用字面 { $lt: ... } 還是 .where().lt() 查詢建構器，最後組出來的查詢物件
  // 結構是一樣的，都會被全域的 mongoose.set("sanitizeFilter", true) 整包誤判成
  // 要塞進 voteEnd 欄位的值去做 Date 轉型，直接噴 CastError。
  // 乾脆不在 Mongo 查詢裡比較時間，先撈出「有延伸故事」的候選，再用 JS 自己篩選
  // 投票是否已過期——這個專案的故事數量不大，效能上完全負擔得起。
  const candidates = await Story.find({ "extensions.0": { $exists: true } }).select(
    "_id voteEnd"
  );
  const now = new Date();
  const expiredStories = candidates.filter(
    (story) => story.voteEnd && story.voteEnd < now
  );

  const results = [];
  for (const { _id } of expiredStories) {
    const storyId = _id.toString();
    try {
      const result = await finalizeVoting({ storyId });
      results.push({ storyId, ...result });
    } catch (error) {
      console.error(`定期結算投票失敗 storyId=${storyId}`, error);
      results.push({ storyId, action: "error", error: error.message });
    }
  }
  return results;
}
