import { Router } from "express";
import * as auth from "../middlewares/auth.js";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router();

router.get("/google", auth.googleAuth);

router.get(
  "/google/redirect",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      // 生成 token
      const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      console.log("生成的 token:", token); // 紀錄生成的 token

      // 將 token 儲存到使用者的 tokens 陣列中
      req.user.tokens.push(token);
      await req.user.save();

      // 重定向到前端，並將 token 作為查詢參數發送
      res.redirect(`http://localhost:3000/?token=${token}`);
      // res.redirect(`http://localhost:3000/`);
    } catch (error) {
      console.error("處理 Google OAuth 時發生錯誤：", error);
    }
  }
);

export default router;
