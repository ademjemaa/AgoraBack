import mongoose from "mongoose";

const upgradeSchema = mongoose.Schema({
  wallet: String,
  account: String,
  status: Number,
  file: String,
  name: String,
  uri: String
});

const upgrade = mongoose.model("upgradeModel", upgradeSchema);

export default upgrade;
