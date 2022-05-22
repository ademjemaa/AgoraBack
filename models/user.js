import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  wallet: String,
  bank: String,
  vault: String,
  earned: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  lastStake: { type: Date, default: new Date() },
  gems: {
    gemCount: { type: Number, default: 0 },
    gemRarirtyTotal: { type: Number, default: 0 },
    gemTypes: {
      standard: { type: Number, default: 0 },
      exclusif: { type: Number, default: 0 },
      premium: { type: Number, default: 0 },
    },
  },
});

const user = mongoose.model("userModel", userSchema);

export default user;
