import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";

// 全站的 rate limit(index.js 裡那組，15 分鐘 300 次)對登入這種敏感端點來說
// 太寬鬆——一個 IP 15 分鐘內可以試 300 次密碼，一天下來足夠跑完一份常見密碼字典。
// 這裡另外開一組更嚴格的，只掛在 /user/login 上。
// skipSuccessfulRequests: 只有失敗的嘗試才會計入次數，正常使用者登入成功不會被誤擋。
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 10, // 同一個 IP 15 分鐘內最多 10 次失敗嘗試
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  message: "登入嘗試次數過多，請稍後再試",
  handler(req, res, next, options) {
    res.status(options.statusCode).json({
      success: false,
      message: options.message,
    });
  },
});
