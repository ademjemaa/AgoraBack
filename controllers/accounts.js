import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { programs } from "@metaplex/js";
import axios from "axios";

import User from "../models/user.js";

const NFTImageDict = {
  exclusive: "/assets/images/nfts/exclusive.svg",
  premium: "/assets/images/nfts/premium.svg",
  standard: "/assets/images/nfts/standard.svg",
};
const NFTWeightDict = {
  Standard: 1,
  Premium: 3.3,
  Exclusive: 33.3,
};

const {
  metadata: { Metadata },
} = programs;

const DEMO_WALLET_SECRET_KEY = new Uint8Array([
  14, 14, 71, 205, 10, 210, 83, 32, 255, 219, 101, 238, 101, 69, 252, 218, 81,
  155, 130, 97, 51, 249, 10, 71, 10, 210, 92, 197, 25, 53, 179, 126, 52, 33, 87,
  2, 113, 159, 112, 151, 17, 150, 131, 33, 222, 52, 126, 56, 30, 103, 67, 194,
  28, 220, 15, 41, 244, 131, 2, 85, 77, 74, 235, 80,
]);
const cnx =
  "https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1/";
const tokenMintAddress = "DEj9UFdH8sv4sT68LEz78Kr3RZ3CwdhhdQDaProeywBP";
let tokenreward = 347.22;

const connection = new web3.Connection(cnx, "confirmed");
var fromWallet = web3.Keypair.fromSecretKey(DEMO_WALLET_SECRET_KEY);

export const getTrans = async (req, res) => {
  try {
    const { to } = req.body;
    const user = await User.findOne({ wallet: to });
    const sign = await transfer(user);
    res.status(200).send(sign.toString());
  } catch (error) {
    console.error(error);
    res.status(400).send("Error at getTrans");
  }
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getTokens = async (req, res) => {
  try {
    const { pubkey } = req.params;
    const owner = new web3.PublicKey(pubkey);
    const tokens = await getTokensByOwner(owner);
    const final_tokens = await getNFTMetadataForMany(tokens);
    res.status(200).send(final_tokens);
  } catch (error) {
    console.error(error);
  }
};

export const getVaultTokens = async (req, res) => {
  try {
    const { mints } = req.body;
    const { pubkey } = req.params;
    const user = await User.findOne({ wallet: pubkey });
    const final_tokens = await getNFTMetadataForMany(mints);
    // re-init user gems & count from scratch
    const newUser = new User();
    user.gems = newUser.gems;
    //loop through all the final_tokens and update the user gems based on name in metadata

    for (let i = 0; i < final_tokens.length; i++) {
      const { name } = final_tokens[i].split(" ")[0];
      //rarity = NFTWeightDict[name.split(" ")[0]] ?? 0;
      if (name === "Exclusive") {
        user.gems.gemRarirtyTotal += NFTWeightDict.exclusive;
        user.gems.gemTypes.exclusif += 1;
      } else if (name === "Premium") {
        user.gems += NFTWeightDict.premium;
        user.gems.gemTypes.premium += 1;
      } else if (name === "Standard") {
        user.gems += NFTWeightDict.standard;
        user.gems.gemTypes.standard += 1;
      }
    }
    user.gems.gemCount = final_tokens.length;
    res.status(200).send(final_tokens);
  } catch (error) {
    console.error(error);
  }
};

// async function calculate(user){
//   if (user.gems.gemCount == 0)
//     return ;
//   let now = new Date().getTime();
//   let time = now - user.lastStake.getTime();
//   let amount = tokenreward * user.gems.gemRarirtyTotal * time;
//   user.lastStake = now;
//   user.earned += amount;
//   console.log(user.earned);
//   await user.save();
//   console.log("user stats " + user);
//   return [user.earned,tokenreward,user.gems.gemRarirtyTotal];
// }

async function calculate(user) {
  const now = new Date().getTime();
  const time = (now - user.lastStake.getTime()) / 1e3;
  const amount = tokenreward * user.gems.gemRarirtyTotal * time;
  user.lastStake = now;
  user.earned += amount;
  const updatedUser = await user.save();
  return [updatedUser.earned, tokenreward, updatedUser.gems.gemRarirtyTotal];
}

/**
 * async function transfer(addr) {

  calculate(addr);
  if (addr.gems.gemCount == 0)
    return ;
  let to = addr.wallet;
  let amount = addr.earned;
  const mintPublicKey = new web3.PublicKey(tokenMintAddress);   

  console.log(mintPublicKey);
  const mint = await getMint(connection, mintPublicKey, splToken.TOKEN_PROGRAM_ID);
  console.log(mint);

  const res = await connection.getTokenAccountsByOwner(fromWallet.publicKey, {
    mint : mint.address
  })
 */

export const getEarned = async (req, res) => {
  try {
    const { to } = req.params;
    const user = await User.findOne({ wallet: to });

    if (!user)
      return res.send({
        toClaim: 0,
        total: 0,
        perDay: 0,
      });

    const [toClaim, tokenReward, gemRarirtyTotal] = await calculate(user);

    res.status(200).json({
      toClaim: toClaim / 1e6,
      total: user.total / 1e6,
      perDay: (tokenReward * gemRarirtyTotal * (60 * 60 * 24)) / 1e6,
    });
  } catch (error) {
    console.error(error);
  }
};

async function transfer(user) {
  if (user.gems.gemCount == 0) throw new Error("No tokens in vault");

  const [toClaim] = await calculate(user);

  let to = user.wallet;
  let amount = Number(parseInt(user.earned));
  // const mintPublicKey = new web3.PublicKey(tokenMintAddress);

  // const mint = await getMint(
  //   connection,
  //   mintPublicKey,
  //   splToken.TOKEN_PROGRAM_ID
  // );

  // const res = await connection.getTokenAccountsByOwner(fromWallet.publicKey, {
  //   mint: mint.address,
  // });

  // const associatedDestinationTokenAddr =
  //   await splToken.getAssociatedTokenAddress(
  //     mint.address,
  //     new web3.PublicKey(to)
  //   );
  // const receiverAccount = await connection.getAccountInfo(
  //   associatedDestinationTokenAddr
  // );
  // const instructions = [];
  // if (receiverAccount == null)
  //   instructions.push(
  //     splToken.createAssociatedTokenAccountInstruction(
  //       fromWallet.publicKey,
  //       associatedDestinationTokenAddr,
  //       new web3.PublicKey(to),
  //       mint.address
  //     )
  //   );
  // else {
  //   const account = await splToken.getAccount(
  //     connection,
  //     associatedDestinationTokenAddr
  //   );
  //   if (account.isFrozen == true)
  //     instructions.push(
  //       splToken.createThawAccountInstruction(
  //         associatedDestinationTokenAddr,
  //         mint.address,
  //         fromWallet.publicKey,
  //         [fromWallet]
  //       )
  //     );
  // }
  // instructions.push(
  //   splToken.createTransferInstruction(
  //     res.value[0].pubkey,
  //     associatedDestinationTokenAddr,
  //     fromWallet.publicKey,
  //     amount,
  //     [fromWallet]
  //   )
  // );
  // if (user.wallet != "4WVgoXKa1u8SGz1aHJPsKRsEEYXJVsZEBazh2a9JkwYj")
  // instructions.push(
  //   splToken.createFreezeAccountInstruction(
  //     associatedDestinationTokenAddr,
  //     mint.address,
  //     fromWallet.publicKey,
  //     [fromWallet]
  //   )
  // );
  // const transaction = new web3.Transaction().add(...instructions);
  // const signature = await web3.sendAndConfirmTransaction(
  //   connection,
  //   transaction,
  //   [fromWallet]
  // );

  user.earned = 0;
  user.total += toClaim;
  await user.save();

  return user.total;
}

async function getTokensByOwner(
  owner //: PublicKey,
) {
  const tokens = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: splToken.TOKEN_PROGRAM_ID,
  });
  // initial filter - only tokens with 0 decimals & of which 1 is present in the wallet
  return tokens.value
    .filter((t) => {
      const amount = t.account.data.parsed.info.tokenAmount;
      return amount.decimals === 0 && amount.uiAmount === 1;
    })
    .map((t) => {
      return { pubkey: t.pubkey, mint: t.account.data.parsed.info.mint };
    });
}

async function getNFTMetadata(
  mint, //: string,
  pubkey //?: string
) {
  //: Promise<INFT | undefined>
  // console.log('Pulling metadata for:', mint);
  try {
    const metadataPDA = await Metadata.getPDA(mint);
    const onchainMetadata = (await Metadata.load(connection, metadataPDA)).data;
    const externalMetadata = (await axios.get(onchainMetadata.data.uri)).data;
    return {
      pubkey: pubkey ? new web3.PublicKey(pubkey) : undefined,
      mint: new web3.PublicKey(mint),
      onchainMetadata,
      externalMetadata,
    };
  } catch (e) {
    console.log(`failed to pull metadata for token ${mint}`);
  }
}

export async function getNFTMetadataForMany(tokens) {
  const promises = [];
  tokens.forEach((t) => promises.push(getNFTMetadata(t.mint, t.pubkey)));
  const nfts = (await Promise.all(promises)).filter((n) => !!n);
  return nfts
    .filter((el) => el.externalMetadata.symbol === "ATLBC")
    .map((el) => ({
      ...el,
      externalMetadata: {
        ...el.externalMetadata,
        image:
          NFTImageDict[el.externalMetadata.name.split(" ")[0].toLowerCase()],
      },
    }))
    .sort((a, b) => {
      return (
        NFTWeightDict[a.externalMetadata.name.split(" ")[0].toLowerCase()] -
        NFTWeightDict[b.externalMetadata.name.split(" ")[0].toLowerCase()]
      );
    });
}
