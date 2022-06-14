import axios from "axios";
import User from "../models/user.js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
const { PublicKey } = require('@solana/web3.js');
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
export const UpgradeNFT = async (req, res) => {
    const { wallet } = req.params;
    let { account } = req.body;
    
    try {
        let user = await User.findOne({ wallet });
        if (!user) {
          user = await User.create({});
          user.wallet = wallet;
        }
        ChangeMetadata(account);
      return res.send("OK");
    } catch (error) {
      console.error(error);
      res.status(409).json({ message: error.message });
    }
  };

const ChangeMetadata = async({account}) => {
    let mintPubkey = new web3.PublicKey(account);
    let tokenmetaPubkey = await Metadata.getPDA(mintPubkey);
    let type;
    let name;
    let image;
    const tokenmeta = await Metadata.load(connection, tokenmetaPubkey);
    console.log(tokenmeta.data.data.name.indexOf("access", 0));
    if (!tokenmeta.data.data.name.indexOf("Premium", 0))
    {
      type = "Exclusive ";
      image = "https://tlbc.mypinata.cloud/ipfs/QmVL85hZGvCXq9C1EfqiW3fJJJp9azyJNR2zEN5iacAZoW";
    }
    else if (!tokenmeta.data.data.name.indexOf("Standard", 0))
    {
      type = "Premium ";
      image = "https://tlbc.mypinata.cloud/ipfs/QmSFnDDPn8B47R3L15iQL5aTpBBJvvEGo4LB4dQwcZEZ79";
    }
    name = type + tokenmeta.data.data.name.substring(tokenmeta.data.data.name.indexOf("access", 0));
    let number = tokenmeta.data.data.name.substring(tokenmeta.data.data.name.indexOf("#", 0) + 1);
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
      pinata.pinJSONToIPFS(body, options).then((result) => {
      console.log(result);
      
      }).catch((err) => {
        console.log(err);
      });
};