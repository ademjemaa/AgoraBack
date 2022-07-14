import express from "express";
import { 
    UpgradeNFT,
    getWaveStats,
    getWaves,
    deleteWave,
    CreateWave  } from "../controllers/upgrade.js";

const router = express.Router();

router.post("/:wallet", UpgradeNFT);
router.get("/wave", getWaveStats);
router.get("/allwaves", getWaves);
router.post("/create", CreateWave);
router.delete("/delete", deleteWave);


export default router;