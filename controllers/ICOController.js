import User from "../models/user.js";
import Ico from "../models/ICO.js";
import axios from "axios";
import * as web3 from "@solana/web3.js";

const coins = Number(process.env.TOTALAGORA);
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const whiteList = require("../config/ICOWhitelist.json")
import _stripe from "stripe";

console.log(web3.clusterApiUrl("mainnet-beta"));
const connection = new web3.Connection(web3.clusterApiUrl("mainnet-beta"));

const stripe = _stripe(process.env.STRIPE_SECRET_KEY);

// if (!process.env.STRIPE_SECRET_KEY)
//   throw new Error("Stripe secret key not set");

const getSolanaPrice = async () =>
  (
    await axios.get(
      "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
    )
  ).data.price;

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

// (async () => {
//   try {
//     const {
//       meta: { postTokenBalances, preTokenBalances },
//     } = await connection.getTransaction(
//       "52ofcARBVdX12gqkkdjuM7CGA3xKud2YECh8tRr3oXwxcgpJE3EKtoEEpe9a7DGvhjj3NUZbRsbxJaEH8C3RfuSd"
//     );
    
//   } catch (error) {
//     console.error(error);
//   }
// })();

const handleICOPurchase = async ({ wallet, method, signature }) => {
  const {
    meta: { postTokenBalances, preTokenBalances },
  } = await connection.getTransaction(
    signature
  );
  let amount = postTokenBalances[0].uiTokenAmount.amount - preTokenBalances[0].uiTokenAmount.amount;
  let publicKey = postTokenBalances[1].owner;
  if (wallet != publicKey) 
    throw new Error("Wrong public key");

  let sol_price = await getSolanaPrice();
  if (method == "SOL") {
    amount = amount * sol_price;
  }
  if (whiteList[wallet]) {
    amount = amount / whiteList[wallet];
  } else throw new Error("Wallet not whitelisted");
  const user = await User.findOne({ wallet: wallet });
  if (!User) throw new Error("user not found");

  if (amount > (await getRemaingingCoins()))
    throw new Error(
      "Out of coins or the amount you chose is greater than what we have left"
    );

  const _ico = await Ico.create({
    wallet,
    amount,
    method,
  });

  user.IcoBaught += _ico.amount;
  user.earned += _ico.amount;
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
    amount,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send(paymentIntent.client_secret);
};
