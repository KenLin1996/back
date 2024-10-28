import passport from "passport";
import { StatusCodes } from "http-status-codes";
import jsonwebtoken from "jsonwebtoken";

export const googleAuth = (req, res, next) => {
  passport.authenticate("google", { session: false }, (error, user, info) => {
    console.log("進入 googleAuth 中介軟體"); // 紀錄進入中介軟體

    if (!user || error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: info?.message || "Google OAuth 驗證失敗",
      });
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
};

export const login = (req, res, next) => {
  passport.authenticate("login", { session: false }, (error, user, info) => {
    if (!user || error) {
      if (info.message === "Missing credentials") {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "輸入欄位錯誤",
        });
        return;
      } else if (info.message === "未知錯誤") {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "未知錯誤",
        });
        return;
      } else {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: info.message,
        });
        return;
      }
    }
    req.user = user;
    next();
  })(req, res, next);
};

export const jwt = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (error, data, info) => {
    if (error || !data) {
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "登入無效",
        });
      } else if (info.message === "未知錯誤") {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "未知錯誤",
        });
      } else {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: info.message,
        });
      }
      return;
    }
    req.user = data.user;
    req.token = data.token;

    next();
  })(req, res, next);
};
