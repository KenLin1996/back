import { Router } from "express";
import { googleAuthLog } from "../controllers/externalAuth.js";
import * as auth from "../middlewares/auth.js";
import passport from "passport";

const router = Router();

router.get("/google", auth.googleAuth, googleAuthLog);

router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  console.log("進入redirect區域");
  return res.redirect("/");
});

export default router;
