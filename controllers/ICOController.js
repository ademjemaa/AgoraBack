import User from "../models/user.js";
import Ico from "../models/ICO.js";
import axios from "axios";
const coins = Number(process.env.TOTALAGORA);
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const whiteList = require("../config/ICOWhitelist.json");
const whiteListedWallets = whiteList.wallets;
let baught = 0;
let coins_left = coins - baught;

export const BuyIco = async (req, res) => {
  
  const { wallet } = req.params;
  let { amount, method } = req.body;

  let sol_price = (
    await axios.get(
      "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
    )
  ).data.price;
  try {
    if (method == "SOL") {
      amount = amount * sol_price;
    }
    let end_tokens = 0;
    if (whiteListedWallets[wallet]) {
      end_tokens = amount / whiteListedWallets[wallet];
    }
    else
      throw new Error("Wallet not whitelisted");
    const user = await User.findOne({ wallet: wallet });
    if (!User) throw new Error("user not found");

    if (amount > coins)
      throw new Error(
        "Out of coins or the amount you chose is greater than what we have left"
      );

    const _ico = await Ico.create({
      wallet,
      end_tokens,
      method,
    });

    user.IcoBaught += _ico.amount;
    user.earned += _ico.amount;
    await user.save();
    await _ico.save();
    return res.status(200).json({
      amount: user.IcoBaught,
      left: coins_left - user.IcoBaught,
    });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const checkWhiteListed = async (req, res) => {
  const { wallet } = req.params;

  try {
    if (whiteListedWallets[wallet.toString()]) {
      const bol = true;
      console.log(whiteListedWallets[wallet.toString()]);
    } else {
      if (bol == false) throw new Error("User not WhiteListed");
    }
    return res.status(200).json({ res: true });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const TotalAgoraLeft = async (req, res) => {
  try {
    baught = await Ico.aggregate([{ $sum: "$amount" }]);
    return res.status(200).json({ left: coins - baught, max: coins });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};
