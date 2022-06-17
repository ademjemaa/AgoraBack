import express from "express";
import {getStats} from "../controllers/dashboard.js"

const router = express.Router();

router.get("/", getStats);

export default router;