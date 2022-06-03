import ICO from "../models/ICO";
import User from "../models/user";
import whiteList from "../config/ICOWhitelist.json";

let totalCoins = 500;

export const BuyIco = async (req, res) => {
    const { wallet } = req.params;
  
    try {
      const user = await User.findOne({ wallet: wallet });
//create user if not found
      if (!user) throw new Error("User not found");

      if(req.body.amount > totalCoins) throw new Error("Out of coins or the amount you chose is greater than what we have left");


      const ico =  new ICO();
      ico.wallet = wallet;
      ico.amount = req.body.amount;
      ico.method = req.body.method;
      ico.token = req.body.token;
      ico.date = new Date();
      user.icoBaught = ico.amount;
      const resUser = await user.save();
      const resIco = await ico.save();
      totalCoins -= ico.amount;
      return res.status(200).json({
        amount: user.icoBaught,
        left: totalCoins,
      });
    } catch (error) {
      res.status(409).json({ message: error.message });
    }
  };

  export const checkWhiteListed = async (req, res) => {
    const { wallet } = req.params;
  
    try {
      if(!(whiteList.includes(wallet.toString()))) throw new Error("User not WhiteListed");

      return res.status(200);

    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  };

  export const TotalAgoraLeft = async (req, res) => {
  
    try {

      return res.status(200).json({ left : totalCoins});

    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  };