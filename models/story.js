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
          "文藝評論",
          "商業理財",
          "藝術設計",
          "人文科普",
          "心靈養生",
          "生活風格",
          "親子共享",
          "傳記/文學史",
          "羅曼史",
          "校園愛情",
          "武俠仙俠",
          "歷史",
          "驚悚推理",
          "奇幻",
          "恐怖靈異",
          "影視",
          "軍事戰爭/災難冒險",
          "溫馨勵志/成長療癒",
          "幽默/諷喻",
          "同志",
          "漫畫",
          "同人",
          "都市",
          "玄幻",
          "科幻",
          "網遊",
          "都會愛情",
          "古代愛情",
          "百合",
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
          "爽文",
          "心情抒發",
          "療癒",
          "青梅竹馬",
          "戰鬥",
          "異界",
          "戀愛",
          "日常",
          "校園",
          "搞笑",
          "後宮",
          "異能",
          "妖怪",
          "妹控",
          "節操",
          "二創",
          "百合",
          "虐心",
          "甜文",
          "悲劇",
          "喜劇",
          "輕鬆",
          "暗黑",
          "清水",
          "穿越",
          "重生",
          "靈異神怪",
          "異國",
          "冒險",
          "女性向",
          "男性向",
          "輕小說",
          "同志",
          "恐怖",
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
