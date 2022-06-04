import mongoose from "mongoose";

const icoSchema = mongoose.Schema({
  wallet: String,
  signature: String,
  amount: { type: Number, default: 0 },
  method: String,
  date: { type: Number, default: new Date() },
});

const ico = mongoose.model("icoModel", icoSchema);

export default ico;
