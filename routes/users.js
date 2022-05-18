import express, { response } from "express";

import { getUsers, createUser, getUser } from "../controllers/users.js";

const router = express.Router();

router.get("/", getUsers);
router.post("/create/", createUser);
router.get("/specific/:wallet", getUser);

export default router;
