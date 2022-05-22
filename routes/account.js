import express from "express";

import { getTrans, getEarned, getTokens } from "../controllers/accounts.js";

const router = express.Router();

router.post("/", getTrans);
router.get("/:to", getEarned);
router.get("/tokens/:pubkey", getTokens);

export default router;
