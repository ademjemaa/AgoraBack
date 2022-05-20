import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import * as bs58 from 'bs58';
import { NodeWallet } from '@metaplex/js';
import pkg from '@solana/spl-token';
const { getMint } = pkg;

import User from "../models/user.js";



const DEMO_WALLET_SECRET_KEY = new Uint8Array([14,14,71,205,10,210,83,32,255,219,101,238,101,69,252,218,81,155,130,97,51,249,10,71,10,210,92,197,25,53,179,126,52,33,87,2,113,159,112,151,17,150,131,33,222,52,126,56,30,103,67,194,28,220,15,41,244,131,2,85,77,74,235,80]);
const cnx = "mainnet-beta";
const tokenMintAddress = "BKuwa6ARkHGQMveboixqVfprvRUEZ163QfnLCbDMrMMQ";
const node_wallet = new NodeWallet()
let tokenreward = 0;

const connection = new web3.Connection(web3.clusterApiUrl(cnx));
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
  console.log("inside calc"+user);
  let now = new Date().getTime();
  let time = now - user.lastStake.getTime();
  let amount = tokenreward * user.gems.gemRarirtyTotal * time;
  user.lastStake = now;
  user.earned += amount;
  console.log(user.earned);
  await user.save();
  return [user.earned,tokenreward,user.gems.gemRarirtyTotal];
}

async function transfer(addr) {

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
