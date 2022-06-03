import express from "express";

import {
  BuyIco,
  checkWhiteListed,
  TotalAgoraLeft,
} from "../controllers/ICOController.js";

const router = express.Router();

router.get("/", TotalAgoraLeft);
router.post("/Buy/:wallet", BuyIco);
router.get("/checkWhiteList/:wallet", checkWhiteListed);

export default router;
