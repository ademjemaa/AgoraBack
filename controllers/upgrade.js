import axios from "axios";
import User from "../models/user.js";
import Upgrade from "../models/upgrade.js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import Wave from "../models/wave.js";
import ico from "../models/ICO.js";
import * as web3 from "@solana/web3.js";
import { createRequire } from "module";
import { exec } from "child_process";
import { token } from "@project-serum/anchor/dist/cjs/utils/index.js";
import mongoose from "mongoose";

import wave from "../models/wave.js";
const require = createRequire(import.meta.url);
var fs = require('fs');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK('dd9892506546216c7b0b', 'ca789c941b9b82210d948d38a611dd79ec69bde59650d08acef0f3974934fcbf');
const CONNECTION_URL =
  "mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs";
  const options = { useNewUrlParser: true, replicaSet: 'rs' };

const passwordInPlaintext = ')4yga#A^4<`p<j]m';
const hash = await bcrypt.hash(passwordInPlaintext, 10);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const transactionOptions = {
  readPreference: 'primary',
  readConcern: { level: 'local' },
  writeConcern: { w: 'majority' }
};

pinata.testAuthentication().then((result) => {
  //handle successful authentication here
  console.log(result);
}).catch((err) => {
  //handle error here
  console.log(err);
});
const connection = new web3.Connection(
  "https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1/",
  "confirmed"
);

let client = await MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })

//a function that creates a new wave objects with the body of the request and returns the new wave in the response
export const CreateWave = async (req, res) => {
  try {
    let match = false;
    let wave;
    const { start, end, premLimit, standLimit, premPrice, standPrice, password } = req.body;
    const waveCollection = client.db('test').collection('waveschemas');
    const pass = await bcrypt.hash(password, 10);
    const isPasswordMatching = await bcrypt.compare(password, hash);
    if (isPasswordMatching)
      match = true;
    if (match)
    {
        wave = await waveCollection.create({
        start,
        end,
        premLimit,
        standLimit,
        premPrice,
        standPrice
      });
    res.status(200).send(wave);
    }
    else
      throw new Error("password doesnt match");
  } catch (error) {
    console.error(error);
    res.status(409).json({ message: error.message });
  }
}

export const deleteWave = async (req, res) => {
  try {
    let match = false;
    let wave;
    const { id, password } = req.body;
    const waveCollection = client.db('test').collection('waveschemas');
    const pass = await bcrypt.hash(password, 10);
    const isPasswordMatching = await bcrypt.compare(password, hash);
    if (isPasswordMatching)
      match = true;
    if (match)
    {
        wave = await Wave.deleteOne({
        id : id
      });
    res.status(200).send("deleted wave");
    }
    else
      throw new Error("password doesnt match");
  } catch (error) {
    console.error(error);
    res.status(409).json({ message: error.message });
  }
}

(async () => {
})();

export const getWaves= async (req, res) => {
  var wave;
  
  //get wave where currentDate is bigger than start and smaller than end
   
    wave = await Wave.find({
    });
  if (wave) {

    console.log(wave);
    res.status(200).send(wave); //for testing purposes
  
  } else {
    res.status(400).send("No wave found");
  }

}

export const getWaveStats = async (req, res) => {
  let currentDate = new Date().getTime();
  var wave;
  
  //get wave where currentDate is bigger than start and smaller than end
    wave = await Wave.findOne({
          start: { $lte: currentDate },
      end: { $gte: currentDate } 
    });
  if (wave) {
    console.log(wave);
    let stats = {
      premLimit: wave.premLimit,
      standLimit: wave.standLimit,
      premPrice: wave.premPrice,
      standPrice: wave.standPrice,
      start: wave.start,
      end: wave.end
    };
    res.status(400).send("No wave found");
    // res.status(200).send(stats); testing

  
  } else {
    res.status(400).send("No wave found");
  }
}

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

export const UpgradeNFT = async (req, res) => {
  const { wallet } = req.params;
  const { account } = req.body;
  let user;
  const tokenCollection = await client.db('test').collection('upgrademodels');
  const tokens = await tokenCollection.deleteMany({});
  const session = await client.startSession();
  try {
    const transactionResults = await session.withTransaction(async () => { 
      const Collection = client.db('test').collection('usermodels');
      user = await Collection.findOne({ wallet });
      }, transactionOptions);
    console.log(user);
    if (!user) {
      user = await User.create({
        wallet : wallet,
        earned : 0,
        burned : 0,
        icoBaught : 0
      });
      await user.save();
    }
    await ChangeMetadata(account, user, session);
    return res.send("OK");
  } catch (error) {
    console.error(error);
    res.status(409).json({ message: error.message });
  }
 finally {
  session.endSession(); 
}
};

const ChangeMetadata = async (account, user, session) => {
  console.log(account);
  console.log(user);

  const wallet = user.wallet;
  let mintPubkey = new web3.PublicKey(account);
  let tokenmetaPubkey = await Metadata.getPDA(mintPubkey);
  let type;
  let name;
  let image;
  let wave;
  let token;

  try {
  const currentDate = new Date().getTime();

  const waveTransactionResults = await session.withTransaction(async () => { 
    const waveCollection = client.db('test').collection('waveschemas');
    const tokenCollection = client.db('test').collection('upgrademodels');
    const Collection = client.db('test').collection('usermodels');

    wave = await waveCollection.findOne({ 
      start: { $lte: currentDate },
      end: { $gte: currentDate } });
    
    console.log(wave);
    if (!wave)
      throw new Error("no wave found");    
    token = await tokenCollection.findOne({ 
      account });
    if (token)
      throw new Error("token upgrade already in progress, please wait for the upgrade to finish or choose another token");
    const tokenmeta = await Metadata.load(connection, tokenmetaPubkey);
    console.log("pre upgrade  : " + tokenmeta.data.data);
    if (!tokenmeta.data.data.name.indexOf("Exclusive", 0))
      throw new Error("Cannot upgrade Exclusive tokens yet, please choose another tier");
    if (!tokenmeta.data.data.name.indexOf("Premium", 0)) {
      type = "Exclusive ";
      if (wave.premLimit == 0)
        throw new Error("Not more Premium upgrades available in current wave");
      if (wave.premPrice * 1e6 > user.earned || typeof user.earned === 'undefined')
        throw new Error("Not enough tokens");
    image = "https://tlbc.mypinata.cloud/ipfs/QmVL85hZGvCXq9C1EfqiW3fJJJp9azyJNR2zEN5iacAZoW";
            
      
      user = await Collection.updateOne({wallet : wallet}, 
        { $set: {earned : (user.earned - wave.premPrice * 1e6), burned : (user.burned + wave.premPrice)}});

      wave = await waveCollection.updateOne({ 
        start: { $lte: currentDate },
        end: { $gte: currentDate } }, { $set : {premLimit : --(wave.premLimit)}});

   }
    else if (!tokenmeta.data.data.name.indexOf("Standard", 0)) {
      type = "Premium ";
      if (wave.standLimit == 0)
        throw new Error("Not more Standard upgrades available in current wave");
      if (wave.standPrice * 1e6 > user.earned || typeof user.earned === 'undefined')
        throw new Error("Not enough tokens");
      image = "https://tlbc.mypinata.cloud/ipfs/QmSFnDDPn8B47R3L15iQL5aTpBBJvvEGo4LB4dQwcZEZ79";
              
        
      user = await Collection.updateOne({wallet : wallet}, 
          { $set: {earned : (user.earned - wave.standPrice * 1e6), burned : (user.burned + wave.standPrice)}});
      wave = await waveCollection.updateOne({ 
          start: { $lte: currentDate },
          end: { $gte: currentDate } }, { $set : {standLimit : --(wave.standLimit)}});
        console.log(wave);
    }

    name = type + tokenmeta.data.data.name.substring(tokenmeta.data.data.name.indexOf("access", 0));
    let number = parseInt(tokenmeta.data.data.name.substring(tokenmeta.data.data.name.indexOf("#", 0) + 1))
    console.log(number);
    const body = {
      "name": name,
      "symbol": "ATLBC",
      "description": "The loft business club is a virtual estate project based on the Solana blockchain offering realistic and customizable flat on the metaverse. To gain access to one of the 5555 Lofts, you need to own an Access Cards. There are three types of them : the Standard (4400 pieces), the Premium (1100 pieces) and the Exclusive (55 pieces). The rarer the Access Card, the bigger the apartment and the amount of special features.",
      "seller_fee_basis_points": 500,
      "image": image,
      "external_url": "https://loftsclub.com/",
      "edition": number,
      "attributes": [{ "trait_type": "access", "value": type }],
      "collection": { "name": "TLBC Access Cards", "family": "Access Cards" },
      "properties": {
        "files": [{ "type": "image/jpeg", "uri": image }],
        "creators": [{ "address": "4KfCr7GQewMMc2xZGz8YSpWJy6PkJdTWhzEAsRboVxe6", "share": 100 }]
      }

    };
    const options = {
      pinataMetadata: {
        name: name,
      },
      pinataOptions: {
        cidVersion: 0
      }
    };
    const result = await pinata.pinJSONToIPFS(body, options)
    if (!token)
    {
      token = await tokenCollection.insertOne({
        wallet : wallet,
        account : account,
        uri : "https://tlbc.mypinata.cloud/ipfs/" + result.IpfsHash,
        name : name
      })
    }
    console.log("user post upgrade : " + user);
    console.log("token: " + token);
    console.log("wave: " + wave);
    createJson(number, name, "https://tlbc.mypinata.cloud/ipfs/" + result.IpfsHash, account, token, tokenCollection);
    console.log(result);
    }, transactionOptions);
  }
  catch (err) {
    // await session.abortTransaction()
    throw err;
  }
}

//function that takes a name and uri, creates a json file with said name and uri and a field for symbol and creator
const createJson = async(number, name, uri, account, token, tokenCollection) => {
  try {
    console.log(token);
    const final_json = {
      "name": name,
      "symbol": "ATLBC",
      "uri": uri,
      "seller_fee_basis_points": 500,
      "creators": [
          {
          "address": "EXBwPeWBeJc1hkupb3cCjnQ7Tr3Q4DN9BF2WheQPFwci",
          "verified": true,
          "share": 0
        },
        {
          "address": "4KfCr7GQewMMc2xZGz8YSpWJy6PkJdTWhzEAsRboVxe6",
          "verified": false,
          "share": 100
        }
      ]
  }
  console.log(final_json);
  const file_name = number + ".json";
  token = await tokenCollection.updateOne({ 
    account : account}, { $set : {file : file_name}});
  fs.writeFile('../json/' + file_name, JSON.stringify(final_json), function (err) {
    if (err) throw err;
    console.log('Saved!');
  });
  await execPromise(`${process.env.METABOSS} update data --account ${account} --keypair ${process.env.KEY_PATH} --new-data-file ../json/${file_name} -r https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1/ -T 9000`);
  console.log(final_json);
  verifyUpgrade(account, token, name, file_name, tokenCollection);
  }
  catch (err) 
  {
    throw (err);
  }
}

const verifyUpgrade = async(account, token, name, file, tokenCollection) => {
  sleep(60 * 1000);
  let mintPubkey = new web3.PublicKey(account);
  let tokenmetaPubkey = await Metadata.getPDA(mintPubkey);
  const tokenmeta = await Metadata.load(connection, tokenmetaPubkey);
  console.log("post upgrade: " + tokenmeta.data.data);
  if (tokenmeta.data.data.name == name)
  {
    await tokenCollection.deleteOne({
      account : account
    });
    console.log("upgrade done for token : " + account);
  }
  else
  {
    console.log("awaiting upgrade for token : " + account);
    await execPromise(`${process.env.METABOSS} update data --account ${account} --keypair ${process.env.KEY_PATH} --new-data-file ../json/${file} -r https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1/ -T 9000`);
    verifyUpgrade(account, token, name, file, tokenCollection);
  }
}