import passport from "passport";
import passportLocal from "passport-local";
import passportJWT from "passport-jwt";
import bcrypt from "bcrypt";
import User from "../models/user.js";

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
