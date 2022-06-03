import ICO from "../models/ICO";

export const BuyIco = async (req, res) => {
    const { wallet } = req.body;
  
    try {
      const user = await User.findOne({ wallet: wallet });
      const ico =  new ICO();
      ico.wallet = wallet;
      ico.ammountBaught = req.body.ammountBaught;
      ico.method = req.body.method;
      ico.token = req.body.token;
      if (!user) throw new Error("User not found");
    } catch (error) {
      res.status(409).json({ message: error.message });
    }
  };