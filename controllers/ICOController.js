import User from "../models/user.js";
import Ico from "../models/ICO.js";
import axios from "axios";
import * as web3 from "@solana/web3.js";
import _stripe from "stripe";
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
import user from "../models/user.js";
const require = createRequire(import.meta.url); // construct the require method
const whiteList = require("../config/ICOWhitelist.json");

const coins = Number(process.env.TOTALAGORA);

const connection = new web3.Connection(
  "https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1/",
  "confirmed"
);
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
  let { amount, paymentMethod, signature } = req.body;

  try {
    await handleICOPurchase({
      wallet,
      amount,
      method: paymentMethod,
      signature,
    });
    return res.send("OK");
  } catch (error) {
    console.error(error);
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
      method: "CARD",
      paymentIntent: payment_intent,
    });
    res.redirect(`${process.env.WEBAPP_HOST}/ico`);
  } catch (error) {
    res.redirect(process.env.WEBAPP_HOST);
  }
};

(async () => {
  try {
    // let first = await User.create({
    // })
    // first.wallet = "8aZZdRXGxbXuSaU9bgBMyMjKR9g1CM8YpzWUaLF7S4iL";
    // await first.save();
    // const result = await User.findOne({wallet: '8aZZdRXGxbXuSaU9bgBMyMjKR9g1CM8YpzWUaLF7S4iL'})
    // result.icoBaught = 15288 * 1e6;
    // result.earned = 15288 * 1e6;
    // await result.delete();
    // console.log(result);
  } catch (error) {
    console.error(error);
  }
})();

const handleICOPurchase = async ({
  wallet,
  method,
  signature,
  amount,
  paymentIntent,
}) => {
  if (method !== "CARD") {
    if (await Ico.findOne({ signature }))
      throw new Error("signature already used");
    console.log("method " + method);
    console.log("wallet: " + wallet);

    let result = null;
    while (result === null) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result = await connection.getTransaction(signature);
    }
    const {
      meta: { postTokenBalances, preTokenBalances, postBalances, preBalances },
    } = result;

    amount = Math.abs(
      ((method === "SOL"
        ? postBalances[0]
        : postTokenBalances[0].uiTokenAmount.amount) -
        (method === "SOL"
          ? preBalances[0]
          : preTokenBalances[0].uiTokenAmount.amount)) /
        1e6
    );
    const accounts = result.transaction.message.accountKeys.map((el) =>
      el.toBase58()
    );
    const publicKey = accounts[0];
    if (wallet != publicKey) throw new Error("Wrong public key");
    let sol_price = await getSolanaPrice();
    if (method == "SOL") {
      if (accounts[accounts.length - 1] == "11111111111111111111111111111111")
        amount = (amount * sol_price * 1.1) / 1e3;
      else throw new Error("Wrong mint address");
    }
  } else {
    if (await Ico.findOne({ paymentIntent }))
      throw new Error("paymentIntent already used");
  }
  amount = amount / 0.013;
  console.log("final tokens " + amount);
  let user = await User.findOne({ wallet });
  if (!user) {
    user = await User.create({});
    user.wallet = wallet;
  }

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
  console.log("pre buy user" + user);

  if (user.icoBaught == null) {
    user.icoBaught = 0;
  }
  if (user.icoBaught != null) {
    user.icoBaught += _ico.amount * 1e6;
  }
  user.earned += _ico.amount * 1e6;
  console.log(user);
  console.log(_ico);
  await user.save();
};

export const checkWhiteListed = async (req, res) => {
  const { wallet } = req.params;

  let price = 0.013;
  let bol = true;
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
      .json({
        left: Math.round((await getRemaingingCoins()) - 20000000),
        max: coins - 20000000,
      });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const getPaymentIntent = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(401).send({ message: error.message });
  }
};
