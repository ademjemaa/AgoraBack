import User from "../models/user.js";

export const getUsers = async (req, res) => {
  try {
    const user = await User.find();

    console.log(user);

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
  const { wallet, vault, bank } = req.body;

  try {
    const user =
      (await User.findOne({ wallet, vault, bank })) ||
      (await User.create({ wallet, vault, bank }));

    res.status(201).json(user);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};
