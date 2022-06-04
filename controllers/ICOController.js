import User from "../models/user.js";
import Ico from "../models/ICO.js";
import axios from "axios";
const coins = Number(process.env.TOTALAGORA);
import whiteList from "../config/ICOWhitelist.json" assert { type: "json" };
import _stripe from "stripe";

const stripe = _stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY)
  throw new Error("Stripe secret key not set");

export const BuyIco = async (req, res) => {
  const { wallet } = req.params;
  let { amount, method } = req.body;

  try {
    let sol_price = (
      await axios.get(
        "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
      )
    ).data.price;
    if (method == "SOL") {
      amount = amount * sol_price;
    }
    let end_tokens = 0;
    if (whiteList[wallet]) {
      end_tokens = amount / whiteList[wallet];
    } else throw new Error("Wallet not whitelisted");
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
    return res.send("OK");
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const checkWhiteListed = async (req, res) => {
  const { wallet } = req.params;

  let price = 0.013;
  let bol = true;
  if (whiteList[wallet]) {
    price = whiteList[wallet];
  } else bol = false;
  let response = {
    price: price,
    can_buy: bol,
  };
  return res.status(200).json(response);
};

export const TotalAgoraLeft = async (req, res) => {
  try {
    const bought = await Ico.aggregate([{ $sum: "$amount" }])[0];
    console.log({ bought });
    return res.status(200).json({ left: coins - bought, max: coins });
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
