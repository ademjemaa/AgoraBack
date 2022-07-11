import express from "express";
import { 
    UpgradeNFT,
    getWaveStats,
    getFakeWaveStats,
    getWaves,
    CreateWave  } from "../controllers/upgrade.js";

const router = express.Router();

router.post("/:wallet", UpgradeNFT);
router.get("/wave", getWaveStats);
router.get("/allwaves", getWaves);
router.post("/wave/create", CreateWave);
router.get("/fakewave", getFakeWaveStats);


export default router;