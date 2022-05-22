import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { NodeWallet } from '@metaplex/js';
import { getMint } from '@solana/spl-token';
import { programs } from "@metaplex/js";
import axios from "axios";
import User from "../models/user.js";


const NFTImageDict = {
  exclusive: "/assets/images/nfts/exclusive.svg",
  premium: "/assets/images/nfts/premium.svg",
  standard: "/assets/images/nfts/standard.svg",
};

const {
  metadata: { Metadata },
} = programs;

const DEMO_WALLET_SECRET_KEY = new Uint8Array([14,14,71,205,10,210,83,32,255,219,101,238,101,69,252,218,81,155,130,97,51,249,10,71,10,210,92,197,25,53,179,126,52,33,87,2,113,159,112,151,17,150,131,33,222,52,126,56,30,103,67,194,28,220,15,41,244,131,2,85,77,74,235,80]);
const cnx = "https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1/";
const tokenMintAddress = "BKuwa6ARkHGQMveboixqVfprvRUEZ163QfnLCbDMrMMQ";
const node_wallet = new NodeWallet()
let tokenreward = 0;

const connection = new web3.Connection(cnx, 'confirmed');
var fromWallet = web3.Keypair.fromSecretKey(DEMO_WALLET_SECRET_KEY);
reward();

export const getTrans =  async (req, res) => {
  try{
    const { to } = req.body;
    const user = await User.findOne({ wallet:to });
    const sign = await transfer(user);
    res.status(200).send(sign.toString());
  }catch (error){
      res.status(400).send('Error at getTrans');
  }
}

export const getEarned =  async (req, res) => {
  try{
      const { to } = req.params;
      const user = await User.findOne({ wallet:to });
      console.log(user);
    const [ sign, tokenreward,gemRarirtyTotal] = await calculate(user);
    res.status(200).json({sign:sign.toString(),total:user.total,tokenReward:tokenreward,gemRarity:gemRarirtyTotal});
  }catch (error){
      res.status(409).send('Error at calculate',error);
  }
}
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getTokens = async (req, res) => {
  try {
   let pubKey = req.params;
   console.log(pubKey.pubkey);
   let owner = new web3.PublicKey(pubKey.pubkey);
   console.log(owner);
   let tokens = await getTokensByOwner(owner);
   let final_tokens = await getNFTMetadataForMany(tokens);
   console.log(final_tokens);
   console.log(tokenreward);
   console.log("rewards : ")
   rewardTier();
    res.status(200).send(final_tokens);
  }catch (error){
    // console.error(error);
    res.status(409).send('Error at getTokens');
  }
}

async function reward()
{
  let user;
  while (user == undefined)
    user = await User.find({});
  console.log(user);
  let totalgems = 0;
  for (let i = 0; i < user.length; i++)
    totalgems += user[i].gems.gemRarirtyTotal;
  console.log("total gems : " + totalgems);
  tokenreward = 2143347 / (totalgems + 1);
  await sleep(300000);
  reward();
};

async function calculate(user){
  if (user.gems.gemCount == 0)
    return ;
  let now = new Date().getTime();
  let time = now - user.lastStake.getTime();
  let amount = tokenreward * user.gems.gemRarirtyTotal * time;
  user.lastStake = now;
  user.earned += amount;
  console.log(user.earned);
  await user.save();
  console.log("user stats " + user);
  return [user.earned,tokenreward,user.gems.gemRarirtyTotal];
}

async function transfer(addr) {

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
  console.log(res.value[0].pubkey.toString());
  const associatedDestinationTokenAddr = await splToken.getAssociatedTokenAddress(
    mint.address,
    new web3.PublicKey(to)
  );
  console.log(associatedDestinationTokenAddr.toString());
  const receiverAccount = await connection.getAccountInfo(associatedDestinationTokenAddr);
  console.log(receiverAccount);
  const instructions = [];
  if (receiverAccount == null)
    instructions.push(
      splToken.createAssociatedTokenAccountInstruction(
        fromWallet.publicKey,
        associatedDestinationTokenAddr,
        new web3.PublicKey(to),
        mint.address,
      )
    )
  else
  {
    const account = await splToken.getAccount(
      connection,
      associatedDestinationTokenAddr
    )
    if (account.isFrozen == true)
    instructions.push(
      splToken.createThawAccountInstruction(
        associatedDestinationTokenAddr,
        mint.address,
        fromWallet.publicKey,
        [fromWallet]
      )
    )
  }
  instructions.push(
    splToken.createTransferInstruction(
      res.value[0].pubkey,
      associatedDestinationTokenAddr,
      fromWallet.publicKey,
      amount,
      [fromWallet]
    )
  )
  instructions.push(
    splToken.createFreezeAccountInstruction(
      associatedDestinationTokenAddr,
      mint.address,
      fromWallet.publicKey,
      [fromWallet]
    )
  )
const transaction = new web3.Transaction().add(...instructions);
console.log(transaction);
const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [fromWallet],
  );
  console.log(signature);
  return(signature);
}

async function getTokensByOwner(
  owner,//: PublicKey,
) {
  console.log(owner);
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
  mint,//: string,
  pubkey,//?: string
)//: Promise<INFT | undefined> 
{
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
  } catch(e){
    console.log(`failed to pull metadata for token ${mint}`);
  }
}

export async function getNFTMetadataForMany(
  tokens,
){
  const promises = [];
  tokens.forEach((t) => promises.push(getNFTMetadata(t.mint, t.pubkey)));
  const nfts = (await Promise.all(promises)).filter((n) => !!n);
  return (nfts)
    .filter((el) => el.externalMetadata.symbol === "ATLBC")
    .map((el) => ({
      ...el,
      externalMetadata: {
        ...el.externalMetadata,
        image:
          NFTImageDict[
            el.externalMetadata.name
              .split(" ")[0]
              .toLowerCase()
          ],
      },
    }));
}