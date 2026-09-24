import { Schema, model } from "mongoose";

const StoryContentSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: [],
    },
    chapterName: {
      type: String,
    },
    chapter: {
      type: Number, // 章節號碼
      default: 1,
    },
    voteCount: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Story",
    },
    main: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

const StorySchema = new Schema(
  {
    mainAuthor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    supportAuthor: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    title: {
      type: String,
    },
    chapters: {
      type: Number, // 總章節數
      default: 1, // 預設為1
    },

    totalWordCount: {
      type: Number,
      default: 0,
    },

    currentChapterWordCount: {
      type: Number,
      default: 0, // 用來追蹤當前章節的累計字數
    },
    wordsPerChapter: {
      type: Number, // 每章的字數限制
      default: 0,
    },
    extendWordLimit: {
      type: Number, // 延伸的字數限制
      default: 0,
    },
    content: {
      type: [StoryContentSchema],
    },
    // 新增 extensions 用來存放延伸內容
    extensions: {
      type: [StoryContentSchema],
      default: [],
    },
    category: {
      type: String,

      enum: {
        values: [
          "愛情",
          "奇幻玄幻",
          "科幻未來",
          "驚悚推理",
          "靈異恐怖",
          "武俠仙俠",
          "都市",
          "心情抒發",
          "LGBTQ+",
          "勵志成長",
          "幽默諷喻",
          "影視",
          "同人",
          "網遊",
          "歷史傳記",
          "軍事戰爭",
          "生活風格",
          "親子共享",
          "藝術設計",
          "科普",
          "商業理財",
          "文藝評論",
          "其他",
        ],
        message: "作品分類錯誤",
      },
    },
    chapterLabels: {
      type: [String],

      enum: {
        values: [
          "不限",
          "戀愛",
          "異界",
          "校園",
          "戰鬥",
          "冒險",
          "魔法",
          "異能",
          "超能力",
          "超自然",
          "重生",
          "穿越",
          "爽文/輕鬆",
          "搞笑",
          "虐心",
          "復仇",
          "靈異神怪",
          "暗黑",
          "恐怖",
          "奇幻",
          "異世界轉生",
          "逆襲",
          "未來世界",
          "英雄",
          "百合",
          "同志",
          "日常",
          "科幻",
          "成長",
          "家庭",
          "友情",
          "偵探",
          "職場",
          "青梅竹馬",
          "後宮",
          "妖怪",
          "節操",
          "二創",
          "悲劇",
          "喜劇",
          "異國",
          "輕小說",
          "心理",
          "神話",
          "蒸汽龐克",
          "時間旅行",
          "機器人",
          "人工智能",
          "動物",
          "快樂",
          "悲傷",
          "焦慮",
          "平靜",
          "懷舊",
          "希望",
          "孤獨",
          "愛",
          "失落",
          "感激",
          "興奮",
          "迷惘",
          "安慰",
          "熱情",
          "自在",
        ],
        message: "作品標籤錯誤",
      },
    },
    state: {
      type: Boolean,
      default: false,
    },
    show: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
    },
    voteTime: {
      type: Number,
      // 投票視窗長度（毫秒）。這個值一旦是 0 或負數，voteEnd 就會等於
      // voteStart，投票視窗長度變成 0 秒——前端倒數計時器一啟動就會判定
      // 「已過期」並立刻觸發結算，使用者只會看到投票區塊一閃而過。
      // 前端表單本來就有 min(10) 檔著，但後端 API 之前完全沒驗證，
      // 繞過表單（測試腳本、直接打 API）就能建出這種壞資料。
      min: [10, "投票時間不可小於 10 毫秒"],
    },
    voteStart: {
      type: Date,
    },
    voteEnd: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    collectionNum: {
      type: Number,
      default: 0,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    latestContent: {
      type: [StoryContentSchema],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model("Story", StorySchema);
