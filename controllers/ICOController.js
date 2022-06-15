import User from "../models/user.js";
import Ico from "../models/ICO.js";
import axios from "axios";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import _stripe from "stripe";
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
import user from "../models/user.js";
const require = createRequire(import.meta.url); // construct the require method
const whiteList = require("../config/ICOWhitelist.json")
const { exec } = require('child_process');
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK('dd9892506546216c7b0b', 'ca789c941b9b82210d948d38a611dd79ec69bde59650d08acef0f3974934fcbf');


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
    await handleICOPurchase({ wallet, amount, method: paymentMethod, signature });
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


const execPromise = (command) =>
  new Promise((resolve, reject) => {
    exec(command, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });

// (async () => {
//   try {
//     const account = "CYXxEsNhLHWimv4DVY3KBmYURnewhB8PRu3NKFo3tLjN";
//     let mintPubkey = new web3.PublicKey("CYXxEsNhLHWimv4DVY3KBmYURnewhB8PRu3NKFo3tLjN");
//     let tokenmetaPubkey = await Metadata.getPDA(mintPubkey);
//     let type;
//     let name;
//     let image;
//     const tokenmeta = await Metadata.load(connection, tokenmetaPubkey);
//     if (!tokenmeta.data.data.name.indexOf("Exclusive", 0))
//       return;
//     if (!tokenmeta.data.data.name.indexOf("Premium", 0)) {
//       type = "Exclusive";
//       image = "https://tlbc.mypinata.cloud/ipfs/QmVL85hZGvCXq9C1EfqiW3fJJJp9azyJNR2zEN5iacAZoW";
//     }
//     else if (!tokenmeta.data.data.name.indexOf("Standard", 0)) {
//       type = "Premium";
//       image = "https://tlbc.mypinata.cloud/ipfs/QmSFnDDPn8B47R3L15iQL5aTpBBJvvEGo4LB4dQwcZEZ79";
//     }
//     name = type + tokenmeta.data.data.name.substring(tokenmeta.data.data.name.indexOf("access", 0) - 1);
//     let number = parseInt(tokenmeta.data.data.name.substring(tokenmeta.data.data.name.indexOf("#", 0) + 1));
//     console.log("edition : " + number);
//     console.log("ipfs image uri : " + image);
//     console.log("card type after upgrade : " + type);
//     const body = {
//       "name": name,
//       "symbol": "ATLBC",
//       "description": "The loft business club is a virtual estate project based on the Solana blockchain offering realistic and customizable flat on the metaverse. To gain access to one of the 5555 Lofts, you need to own an Access Cards. There are three types of them : the Standard (4400 pieces), the Premium (1100 pieces) and the Exclusive (55 pieces). The rarer the Access Card, the bigger the apartment and the amount of special features.",
//       "seller_fee_basis_points": 500,
//       "image": image,
//       "external_url": "https://loftsclub.com/",
//       "edition": number,
//       "attributes": [{ "trait_type": "access", "value": type }],
//       "collection": { "name": "TLBC Access Cards", "family": "Access Cards" },
//       "properties": {
//         "files": [{ "type": "image/jpeg", "uri": image }],
//         "creators": [{ "address": "4KfCr7GQewMMc2xZGz8YSpWJy6PkJdTWhzEAsRboVxe6", "share": 100 }]
//       }

//     };
//     const options = {
//       pinataMetadata: {
//         name: name,
//       },
//       pinataOptions: {
//         cidVersion: 0
//       }
//     };
//     const result = await pinata.pinJSONToIPFS(body, options)
//     console.log(result);
//     await execPromise(`metaboss update uri --account ${account} --keypair ${process.env.KEY_PATH} --new-uri "https://tlbc.mypinata.cloud/ipfs/${result.IpfsHash}" -r https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1 -T 9000`)
//     await execPromise(`metaboss update name --account ${account} --keypair ${process.env.KEY_PATH} --new-name "${name}" -r https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1 -T 9000`)

//     console.log("done");
//   } catch (error) {
//     console.error(error)
//   }

// })();

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

    amount =
      Math.abs(((method === "SOL"
        ? postBalances[0]
        : postTokenBalances[0].uiTokenAmount.amount) -
        (method === "SOL"
          ? preBalances[0]
          : preTokenBalances[0].uiTokenAmount.amount)) /
        1e6);
    const accounts = result.transaction.message.accountKeys.map(el => el.toBase58());
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
    user = await User.create({
    })
    user.wallet = wallet;
  };

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
      .json({ left: Math.round((await getRemaingingCoins()) - 20000000), max: coins - 20000000 });
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
