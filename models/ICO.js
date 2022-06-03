import { PublicKey } from "@solana/web3.js";
import mongoose from "mongoose";

const icoSchema = mongoose.Schema({
  amount: { type : Number, default: 0},
  method: String,
  token: String,
  wallet: PublicKey,
  date: Date
});

const ICO = mongoose.model("icoModel", icoSchema);

export default ICO;
