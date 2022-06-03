import mongoose from "mongoose";

const totalCoins = mongoose.Schema({
  amount: { type : Number, default: 500},
});

const Coins = mongoose.model("coinsModel", totalCoins);

export default Coins;
