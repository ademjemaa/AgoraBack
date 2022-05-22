import express from "express";

import {
  getTrans,
  getEarned,
  getTokens,
  getVaultTokens,
} from "../controllers/accounts.js";

const router = express.Router();

router.post("/", getTrans);
router.get("/:to", getEarned);
router.get("/tokens/:pubkey", getTokens);
router.post("/vault-tokens", getVaultTokens);

export default router;
