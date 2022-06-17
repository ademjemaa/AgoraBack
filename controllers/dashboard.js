import User from "../models/user.js";


//create a function that takes a request and response, loops through all users and returns the number of gems by type
export const getGemCount = async (req, res) => {
    try {
        const users = await User.find();
        let gemCount = {
            standard: 0,
            premium: 0,
            exclusif: 0,
            burned: 0,
        };
        for (let i = 0; i < users.length; i++) {
            gemCount.standard += users[i].gems.gemTypes.standard;
            gemCount.exclusif += users[i].gems.gemTypes.exclusif;
            gemCount.premium += users[i].gems.gemTypes.premium;
            gemCount.burned += users[i].burned;
        }
        res.status(200).json(gemCount);
    } catch (error) {
        res.status(400).send(error.message);
    }
}