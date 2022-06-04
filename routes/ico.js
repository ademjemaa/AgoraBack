import express from "express";

import {
  BuyIco,
  checkWhiteListed,
  TotalAgoraLeft,
  getPaymentIntent,
} from "../controllers/ICOController.js";

import _stripe from "stripe";

const router = express.Router();

router.post("/create-payment-intent", getPaymentIntent);
router.get("/", TotalAgoraLeft);
router.post("/Buy/:wallet", BuyIco);
router.get("/checkWhiteList/:wallet", checkWhiteListed);
export default router;
