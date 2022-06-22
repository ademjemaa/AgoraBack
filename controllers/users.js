import User from "../models/user.js";

export const getUsers = async (req, res) => {
  try {
    const user = await User.find();

    res.status(200).json(user);
  } catch (error) {
    res.status(400).send("Error at getUsers");
  }
};

export const getUser = async (req, res) => {
  try {
    const { wallet } = req.params;
    const user = await User.findOne({ wallet });
    if (!user) throw new Error("User not found");

    res.status(200).json(user);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const createUser = async (req, res) => {
  const { wallet, vault, bank, gems, earned, total, lastStake } = req.body;
  try {
    const user =
      (await User.findOne({ wallet })) ||
      (await User.create({
        wallet,
        vault,
        bank,
        gems,
        earned,
        total,
        lastStake,
      }));

    if (typeof User.bank != typeof "" || typeof bank == typeof "") {
      user.bank = bank;
      user.vault = vault;
      const updatedUser = await user.save();
      res.status(201).json(updatedUser);
    } else {
      res.status(201).json(user);
    }
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateUserGems = async (req, res) => {
  const { wallet, gems, lastStake } = req.body;

  try {
    const user = await User.findOne({ wallet: wallet });

    user.lastStake = lastStake;
    user.gems.gemCount += gems.gemCount;
    user.gems.gemRarirtyTotal += gems.gemRarirtyTotal;
    user.gems.gemTypes.standard += gems.gemTypes.standard;
    user.gems.gemTypes.exclusif += gems.gemTypes.exclusif;
    user.gems.gemTypes.premium += gems.gemTypes.premium;
    user.lastStake = new Date();
    if (user.gems.gemCount <= 0 || user.gems.gemRarirtyTotal <= 0) {
      user.gems.gemCount = 0;
      user.gems.gemRarirtyTotal = 0;
      user.gems.gemTypes.standard = 0;
      user.gems.gemTypes.exclusif = 0;
      user.gems.gemTypes.premium = 0;
    }

    await user.save();
    if (!user) throw new Error("User not found");
    res.status(201).json(user);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getUserCurrentReward = async (req, res) => {
  const { wallet } = req.body;

  try {
    const user = await User.findOne({ wallet: wallet });
    res.status(200).json(user);
    if (!user) throw new Error("User not found");
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};
