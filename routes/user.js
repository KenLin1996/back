import { Router } from "express";
import {
  create,
  login,
  extend,
  profile,
  editProfile,
  logout,
  addMark,
} from "../controllers/user.js";
import * as auth from "../middlewares/auth.js";

const router = Router();

router.post("/", create);
router.post("/login", auth.login, login);
router.post("/addBookmark", auth.jwt, addMark);

router.patch("/extend", auth.jwt, extend);
router.patch("/profile", auth.jwt, editProfile);

router.get("/profile", auth.jwt, profile);

router.delete("/logout", auth.jwt, logout);

export default router;
