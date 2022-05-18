import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    to: String,
    amount: Number,
});

export default user;