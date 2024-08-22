import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import routeUser from "./routes/user.js";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import "./passport/passport.js";
import routeStory from "./routes/story.js";

const app = express();

app.use(
  rateLimit({
    windowMs: 1000 * 60 * 15,
    max: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "請求太多",
    handler(req, res, next, options) {
      res.status(options.statusCode).json({
        success: false,
        message: options.message,
      });
    },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (
        origin === undefined ||
        origin.includes("github.io") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS"), false);
      }
    },
  })
);

app.use(express.json());

app.use((_, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: "資料格式錯誤",
  });
});

app.use(mongoSanitize());

app.use("/user", routeUser);
app.use("/story", routeStory);

app.all("*", (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "找不到頁面",
  });
});

app.listen(process.env.PORT || 4000, async () => {
  console.log("伺服器啟動");
  await mongoose.connect(process.env.DB_URL);
  mongoose.set("sanitizeFilter", true);
  console.log("資料庫連線成功");
});
