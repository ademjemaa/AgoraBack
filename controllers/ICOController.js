

import User from "../models/user.js";
import Ico from "../models/ICO.js";
import Coins from "../models/totalICO.js";


import * as whiteList from '../config/ICOWhitelist.json';
import { ComputeBudgetInstruction } from "@solana/web3.js";
const whiteListedWallets = whiteList.default.wallets;


export const BuyIco = async (req, res) => {
    const { wallet } = req.params;
  
    try {
      const user = await User.findOne({ wallet: wallet });
      const coin = await Coins.find();

//create user if not found
      if (!user) throw new Error("User not found");

      if(req.body.amount > coin.amount) throw new Error("Out of coins or the amount you chose is greater than what we have left");


      const _Ico =  new Ico();
      _Ico.wallet = wallet;
      _Ico.amount = req.body.amount;
      _Ico.method = req.body.method;
      _Ico.token = req.body.token;
      _Ico.date = new Date();
      user.IcoBaught = _Ico.amount;
      const resUser = await user.save();
      const resIco = await Ico.save();
      coin.amount -= _Ico.amount;
      return res.status(200).json({
        amount: user.IcoBaught,
        left: coin.amount,
      });
    } catch (error) {
      res.status(409).json({ message: error.message });
    }
  };

  export const checkWhiteListed = async (req, res) => {
    const { wallet } = req.params;
  
    try {
      if(!(whiteListedWallets.includes(wallet.toString()))) throw new Error("User not WhiteListed");

      return res.status(200);

    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  };

  export const TotalAgoraLeft = async (req, res) => {
  
    try {
      const res = await Coins.find();
      if(!res){
        const coin = new Coins();
        await coin.save();
      }
      return res.status(200).json({ left : totalCoins});

    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  };