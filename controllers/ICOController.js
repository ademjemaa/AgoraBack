import User from "../models/user.js";
import Ico from "../models/ICO.js";
import axios from "axios";
import * as web3 from "@solana/web3.js";
import whiteList from "../config/ICOWhitelist.json" assert { type: "json" };
import _stripe from "stripe";

const coins = Number(process.env.TOTALAGORA);

const connection = new web3.Connection(web3.clusterApiUrl("mainnet-beta"));

const stripe = _stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY)
  throw new Error("Stripe secret key not set");

const getSolanaPrice = async () =>
  Number(
    (
      await axios.get(
        "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
      )
    ).data.price
  );

export const BuyIco = async (req, res) => {
  const { wallet } = req.params;
  let { amount, method, signature } = req.body;

  try {
    await handleICOPurchase({ wallet, amount, method, signature });
    return res.send("OK");
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const handleStripeCheckout = async (req, res) => {
  try {
    const { publicKey, payment_intent, redirect_status } = req.query;

    if (redirect_status !== "succeeded")
      throw new Error("Stripe checkout failed");

    const { amount, status } = await stripe.paymentIntents.retrieve(
      payment_intent
    );

    if (status !== "succeeded") throw new Error("Stripe checkout failed");

    await handleICOPurchase({
      wallet: publicKey,
      amount: amount / 100,
      method: "FIAT",
      paymentIntent: payment_intent,
    });
    res.redirect(`${process.env.WEBAPP_HOST}/ico`);
  } catch (error) {
    res.redirect(process.env.WEBAPP_HOST);
  }
};

const handleICOPurchase = async ({
  wallet,
  method,
  signature,
  amount,
  paymentIntent,
}) => {
  if (method !== "FIAT") {
    if (await Ico.findOne({ signature }))
      throw new Error("signature already used");

    const {
      meta: { postTokenBalances, preTokenBalances },
    } = await connection.getTransaction(signature);
    amount =
      postTokenBalances[0].uiTokenAmount.amount -
      preTokenBalances[0].uiTokenAmount.amount;
    let publicKey = postTokenBalances[1].owner;
    if (wallet != publicKey) throw new Error("Wrong public key");
    let sol_price = await getSolanaPrice();
    if (method == "SOL") {
      amount = amount * sol_price;
    }
  } else {
    if (await Ico.findOne({ paymentIntent }))
      throw new Error("paymentIntent already used");
  }
  if (whiteList[wallet]) {
    amount = amount / whiteList[wallet];
  } else throw new Error("Wallet not whitelisted");
  const user = await User.findOne({ wallet });
  if (!User) throw new Error("user not found");

  if (amount > (await getRemaingingCoins()))
    throw new Error(
      "Out of coins or the amount you chose is greater than what we have left"
    );

  const _ico = await Ico.create({
    wallet,
    amount,
    method,
    signature,
  });

  user.icoBaught += _ico.amount * 1e6;
  user.earned += _ico.amount * 1e6;
  await user.save();
};

export const checkWhiteListed = async (req, res) => {
  const { wallet } = req.params;

  let price = 0.013;
  let bol = true;
  if (whiteList[wallet]) {
    price = whiteList[wallet];
  } else bol = false;
  let response = {
    solanaPrice: await getSolanaPrice(),
    price: price,
    canBuy: bol,
  };
  return res.status(200).json(response);
};

const getRemaingingCoins = async () => {
  return (
    coins -
    ((await Ico.aggregate([
      {
        $group: {
          _id: null,
          sum: {
            $sum: "$amount",
          },
        },
      },
    ])[0]?.sum) ||
      (await Ico.find()).reduce((prev, cur) => prev + cur.amount, 0) ||
      0)
  );
};

export const TotalAgoraLeft = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ left: await getRemaingingCoins(), max: coins });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const getPaymentIntent = async (req, res) => {
  const { amount, publicKey } = req.body;
  if (!publicKey) return res.status(403).send("Public key is required");

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send(paymentIntent.client_secret);
};
