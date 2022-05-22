import express from "express";

import {
  getUsers,
  createUser,
  getUser,
  updateUserGems,
} from "../controllers/users.js";

const router = express.Router();

router.get("/", getUsers);
router.post("/create/", createUser);
router.get("/specific/:wallet", getUser);
router.patch("/update", updateUserGems);

export default router;
