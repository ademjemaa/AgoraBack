import user from '../models/user.js';


export const getUsers =  async (req, res) => {
    try{
        const _user = await user.find();

        console.log(_user);

        res.status(200).json(_user);
    }catch (error){
        res.status(400).send('Error at getUsers');
    }
}

export const createUsers =  async (req, res) => {
    const { wallet } = req.params;
    const _user = req.body;

    const newUser = new user(_user);

    try{
        await newUser.save();

        res.status(201).json(newUser);
    }catch{
        res.status(409).json({message: error.message});
    }
}