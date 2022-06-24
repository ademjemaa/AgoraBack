import mongoose from "mongoose";

const upgradeSchema = mongoose.Schema({
  wallet: String,
  account: String,
  file: String,
  name: String,
  uri: String
});

const upgrade = mongoose.model("upgradeModel", upgradeSchema);

export default upgrade;
