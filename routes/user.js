import { Router } from "express";
import {
  create,
  login,
  addMark,
  extend,
  editProfile,
  // updateUserVoteCount,
  profile,
  getExtensionStory,
  logout,
} from "../controllers/user.js";
import * as auth from "../middlewares/auth.js";

const router = Router();

router.post("/", create);
router.post("/login", auth.login, login);
router.post("/addBookmark", auth.jwt, addMark);

router.patch("/extend", auth.jwt, extend);
router.patch("/profile", auth.jwt, editProfile);
// router.patch("/:userId/voteHistory", auth.jwt, updateUserVoteCount);
// router.patch("/:id/voteHistory", auth.jwt, updateUserVoteCount);

router.get("/profile", auth.jwt, profile);
router.get("/getExtension", auth.jwt, getExtensionStory);

router.delete("/logout", auth.jwt, logout);

export default router;
