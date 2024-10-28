import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

export const googleAuthLog = async (req, res) => {
  try {
    console.log("執行後端 googleAuthLog");
    console.log("已驗證的使用者:", req.user); // 紀錄經過驗證的使用者資訊

    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("生成的 token:", token); // 紀錄生成的 token

    req.user.tokens.push(token);
    await req.user.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "登入成功",
      token,
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
      },
    });
  } catch (error) {
    console.error("Google OAuth 驗證錯誤：", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "伺服器錯誤，請稍後再試",
    });
  }
};
