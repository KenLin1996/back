import { Router } from "express";
import {
  create,
  login,
  addMark,
  extend,
  editProfile,
  profile,
  getExtensionStory,
  checkBookmarkStatus,
  logout,
} from "../controllers/user.js";
import * as auth from "../middlewares/auth.js";

const router = Router();

router.post("/", create);
router.post("/login", auth.login, login);
router.post("/addBookmark", auth.jwt, addMark);

router.patch("/extend", auth.jwt, extend);
router.patch("/profile", auth.jwt, editProfile);

router.get("/profile", auth.jwt, profile);
router.get("/getExtension", auth.jwt, getExtensionStory);
router.get("/checkBookmark/:id", auth.jwt, checkBookmarkStatus);

router.delete("/logout", auth.jwt, logout);

export default router;
