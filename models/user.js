import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    wallet: String,
    bank: String,
    vault: String,
    earned : Number,
    total: Number,
    lastStake : Date,
    gems : {
        gemCount: Number,
        gemRarirtyTotal: Number,
        gemTypes : {
            standard: Number,
            exclusif: Number,
            premium: Number,
        }
    }
});


const user = mongoose.model('userModel', userSchema);

export default user;