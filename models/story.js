import { Schema, model } from "mongoose";
// import StoryContentSchema from "./storyContent.js";

const StoryContentSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      // type: ObjectId,
      ref: "User",
      // required: [true, "作者必填"],
    },
    content: {
      // type: String,
      type: [],
      // required: [true, "內容必填"],
    },
    chapterName: {
      type: String,
      // required: [true, "章節名稱必填"],
    },
    voteCount: {
      type: Number,
      default: 0,
      // required: [true, "投票數必填"],
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Story",
      // required: [true, "父級故事ID必填"],
    },
    main: {
      type: Boolean,
      // required: [true, "是否主章節必填"],
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
      // required: [true, "主要作者必填"],
    },
    supportAuthor: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    title: {
      type: String,
      // required: [true, "故事名稱必填"],
    },
    chapterName: {
      type: String,
      // required: [true, "章節名稱必填"],
    },
    totalWordCount: {
      type: String,
      // required: [true, "文章總字數必填"],
    },
    content: {
      type: [StoryContentSchema],
      // required: [true, "內容必填"],
    },
    // 新增 extensions 用來存放延伸內容
    extensions: {
      type: [StoryContentSchema],
      default: [], // 預設為空陣列
    },
    category: {
      type: String,
      // required: [true, "作品分類必填"],
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
      // required: [true, "作品標籤必填"],
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
      // required: [true, "狀態必填"],
    },
    show: {
      type: Boolean,
      // required: [true, "顯示方式必填"],
    },
    image: {
      type: String,
      // required: [true, "書封必填"],
    },
    voteTime: {
      type: Number,
      // required: [true, "投票時間必填"],
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
      // required: [true, "瀏覽數必填"],
    },
    collectionNum: {
      type: Number,
      default: 0,
      // required: [true, "收藏數必填"],
    },
    followNum: {
      type: Number,
      default: 0,
      // required: [true, "關注數必填"],
    },
    totalVotes: {
      type: Number,
      default: 0,
      // required: [true, "總投票數必填"],
    },
    latestContent: {
      type: [StoryContentSchema],
      // required: [true, "最新內容必填"],
    },
  },
  { timestamps: true }
);

export default model("Story", StorySchema);
