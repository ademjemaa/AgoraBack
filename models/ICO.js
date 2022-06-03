import { PublicKey } from "@solana/web3.js";
import mongoose from "mongoose";

const icoSchema = mongoose.Schema({
  ammountBaught: Number,
  method: String,
  token: String,
  wallet: PublicKey,
});

const ICO = mongoose.model("icoModel", icoSchema);

export default ICO;
