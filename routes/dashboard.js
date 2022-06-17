import express from "express";
import {getGemCount} from "../controllers/dashboard.js"

const router = express.Router();

router.get("/", getGemCount);

export default router;