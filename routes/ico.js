import express from "express";

import {
  BuyIco,
  checkWhiteListed,
  TotalAgoraLeft,
} from "../controllers/ICOController.js";

const router = express.Router();

router.get("/", TotalAgoraLeft);
router.post("/buy/:wallet", BuyIco);
router.get("/checkWhiteList/:wallet", checkWhiteListed);
router.get("/price/:wallet", checkWhiteListed);

export default router;
