import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import passportLocal from "passport-local";
import passportJWT from "passport-jwt";
import bcrypt from "bcrypt";
import User from "../models/user.js";

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://kenlin1996.github.io/final_project_front/redirect.html", // Google 認證完成後的重定向路徑
      scope: ["profile", "email"], // Google OAuth 所需的範圍
      prompt: "select_account", // 請求使用者選擇 Google 帳戶
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 尋找是否已有使用者
        let foundUser = await User.findOne({ googleID: profile.id }).exec();
        if (foundUser) {
          console.log("找到已註冊的使用者，跳過新增用戶步驟");
          return done(null, foundUser);
        }
        // 若無用戶，則創建新用戶
        console.log("偵測到新用戶，開始創建新用戶資料");
        let newUser = new User({
          username: profile.displayName,
          googleID: profile.id,
          avatar: profile.photos[0].value,
          email: profile.emails[0].value,
        });

        // 儲存用戶資料
        let savedUser = await newUser.save();
        console.log("新用戶創建成功");
        done(null, savedUser);
      } catch (error) {
        console.error("處理 Google Strategy 驗證時發生錯誤：", error);
        done(error, null);
      }
    }
  )
);

passport.use(
  "login",
  new passportLocal.Strategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error("EMAIL");
        }
        if (!bcrypt.compareSync(password, user.password)) {
          throw new Error("PASSWORD");
        }
        return done(null, user, null);
      } catch (e) {
        console.log(error);
        if (error.message === "EMAIL") {
          return done(null, null, { message: "使用者帳號不存在" });
        } else if (error.message === "PASSWORD") {
          return done(null, null, { message: "使用者密碼錯誤" });
        } else {
          return done(null, null, { message: "未知錯誤" });
        }
      }
    }
  )
);

passport.use(
  "jwt",
  new passportJWT.Strategy(
    {
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
      ignoreExpiration: true,
    },
    async (req, payload, done) => {
      try {
        const expired = payload.exp * 1000 < new Date().getTime();

        /*
        http://localhost:4000/user/test?aaa=111&bbb=222
        req.originUrl = /user/test?aaa=111&bbb=222
        req.baseUrl = /user
        req.path = /test
        req.query = { aaa: 111, bbb: 222 }
      */
        const url = req.baseUrl + req.path;
        if (expired && url !== "/user/extend" && url !== "/user/logout") {
          throw new Error("EXPIRED");
        }

        const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        const user = await User.findOne({ _id: payload._id, tokens: token });
        if (!user) {
          throw new Error("JWT");
        }

        return done(null, { user, token }, null);
      } catch (error) {
        console.log(error);
        if (error.message === "EXPIRED") {
          return done(null, null, { message: "登入過期" });
        } else if (error.message === "JWT") {
          return done(null, null, { message: "登入無效" });
        } else {
          return done(null, null, { message: "未知錯誤" });
        }
      }
    }
  )
);
