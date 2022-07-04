import express from "express";
import { 
    UpgradeNFT,
    getWaveStats,
    CreateWave  } from "../controllers/upgrade.js";

const router = express.Router();

router.post("/:wallet", UpgradeNFT);
router.get("/wave", getWaveStats);
router.post("/wave/create", CreateWave);

export default router;