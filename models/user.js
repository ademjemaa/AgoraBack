import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    wallet: String,
    bank: String,
    vault: String,
});


const user = mongoose.model('userModel', userSchema);

export default user;