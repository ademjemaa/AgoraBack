import axios from "axios";
import User from "../models/user.js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import Wave from "../models/wave.js";
import * as web3 from "@solana/web3.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK('dd9892506546216c7b0b', 'ca789c941b9b82210d948d38a611dd79ec69bde59650d08acef0f3974934fcbf');


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

//a function that creates a new wave objects with the body of the request and returns the new wave in the response
export const CreateWave = async(req, res) => {
  try {
    const { start, end, premLimit, standLimit, premPrice, standPrice } = req.body;
    const wave = await Wave.create({
      start,
      end,
      premLimit,
      standLimit,
      premPrice,
      standPrice
    });
    res.send(wave);
  } catch (error) {
    console.error(error);
    res.status(409).json({ message: error.message });
  }
}

export const getWaveStats = async (req, res) => {
  let currentDate = new Date();
  //get wave where currentDate is bigger than start and smaller than end
  let wave = await Wave.findOne({
    start: { $lte: currentDate },
    end: { $gte: currentDate }
  });
  if (wave) {
    let stats = {
      premLimit: wave.premLimit,
      standLimit: wave.standLimit,
      premPrice: wave.premPrice,
      standPrice: wave.standPrice,
      start: wave.start,
      end: wave.end
    };
    res.status(200).send(stats);
  } else {
    res.status(400).send("No wave found");
  }
}


export const UpgradeNFT = async (req, res) => {
    const { wallet } = req.params;
    let { account } = req.body;
    
    try {
        let user = await User.findOne({ wallet });
        if (!user) {
          user = await User.create({});
          user.wallet = wallet;
        }
        ChangeMetadata(account, user);
      return res.send("OK");
    } catch (error) {
      console.error(error);
      res.status(409).json({ message: error.message });
    }
  };

const ChangeMetadata = async({account, user}) => {
  try {
    let mintPubkey = new web3.PublicKey(account);
    let tokenmetaPubkey = await Metadata.getPDA(mintPubkey);
    const currentDate = new Date();
    let type;
    let name;
    let image;
    let wave = await Wave.findOne({
      start: { $lte: currentDate },
      end: { $gte: currentDate }
    });
    const tokenmeta = await Metadata.load(connection, tokenmetaPubkey);
    console.log(tokenmeta.data.data.name.indexOf("access", 0));
    if (!tokenmeta.data.data.name.indexOf("Premium", 0))
    {
      type = "Exclusive ";
      if (wave.premLimit == 0)
        throw new Error("Not more Premium upgrades available in current wave");
      if (wave.premPrice > user.earned)
        throw new Error("Not enough tokens");
      image = "https://tlbc.mypinata.cloud/ipfs/QmVL85hZGvCXq9C1EfqiW3fJJJp9azyJNR2zEN5iacAZoW";
      user.earned -= wave.premPrice;
      user.burned += wave.premPrice;
      wave.premLimit--;
      await wave.save();
    }
    else if (!tokenmeta.data.data.name.indexOf("Standard", 0))
    {
      type = "Premium ";
      if (wave.standLimit == 0)
        throw new Error("Not more Standard upgrades available in current wave");
      if (wave.standPrice > user.earned)
        throw new Error("Not enough tokens");
      image = "https://tlbc.mypinata.cloud/ipfs/QmSFnDDPn8B47R3L15iQL5aTpBBJvvEGo4LB4dQwcZEZ79";
      user.earned -= wave.standPrice;
      user.burned += wave.standPrice;
      wave.standLimit--;
      await wave.save();
    }
    name = type + tokenmeta.data.data.name.substring(tokenmeta.data.data.name.indexOf("access", 0));
    let number = parseInt(tokenmeta.data.data.name.substring(tokenmeta.data.data.name.indexOf("#", 0) + 1))
    console.log(number);
    const body = {
      "name":name,
      "symbol":"ATLBC",
      "description":"The loft business club is a virtual estate project based on the Solana blockchain offering realistic and customizable flat on the metaverse. To gain access to one of the 5555 Lofts, you need to own an Access Cards. There are three types of them : the Standard (4400 pieces), the Premium (1100 pieces) and the Exclusive (55 pieces). The rarer the Access Card, the bigger the apartment and the amount of special features.",
      "seller_fee_basis_points":500,
      "image":image,
      "external_url":"https://loftsclub.com/",
      "edition":number,
      "attributes":[{"trait_type":"access","value":type}],
      "collection":{"name":"TLBC Access Cards", "family":"Access Cards"},
      "properties":{"files":[{"type":"image/jpeg","uri":image}],
      "creators":[{"address":"4KfCr7GQewMMc2xZGz8YSpWJy6PkJdTWhzEAsRboVxe6","share":100}]}
    
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
    console.log(result);
    await execPromise(`metaboss update uri --account ${account} --keypair ${process.env.KEY_PATH} --new-uri "https://tlbc.mypinata.cloud/ipfs/${result.IpfsHash}" -r https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1 -T 9000`);
    await execPromise(`metaboss update name --account ${account} --keypair ${process.env.KEY_PATH} --new-name "${name}" -r https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1 -T 9000`);
    console.log("done");
    await user.save();
  } catch (error) {
    console.error(error)
  }
};