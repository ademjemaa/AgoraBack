import User from "../models/user.js";
import Ico from "../models/ICO.js";

const coins = Number(process.env.TOTALAGORA);

import * as whiteList from "../config/ICOWhitelist.json" assert { type: "json" };

if (!process.env.STRIPE_SECRET_KEY)
  throw new Error("Stripe secret key not set");

const stripe = _stripe(process.env.STRIPE_SECRET_KEY);

const whiteListedWallets = whiteList.default.wallets;
let baught = 0;
let coins_left = coins - baught;

export const BuyIco = async (req, res) => {
  const { wallet } = req.params;
  const { amount, method, token } = req.body;

  try {
    const user = await User.findOne({ wallet: wallet });
    if (!User) throw new Error("user not found");

    if (amount > coins)
      throw new Error(
        "Out of coins or the amount you chose is greater than what we have left"
      );

    const _ico = await Ico.create({
      wallet,
      amount,
      method,
      token,
    });
    user.IcoBaught = _ico.amount;
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
    const bol = whiteListedWallets.includes(wallet.toString());
    if (bol == false) throw new Error("User not WhiteListed");
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

export const getPaymentIntent = async (req, res) => {
  const { amount, publicKey } = req.body;
  if (!publicKey) return res.status(403).send("Public key is required");

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send(paymentIntent.client_secret);
};
