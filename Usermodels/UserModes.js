import mongoose from 'mongoose';

// Define the user schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true 
    },
    password: {
        type: String,
        required: true
    },
    watchlistArray: {
        type: Array,
        required : false,
    }
}, {
    timestamps: true 
});

// Create the model
const User = mongoose.model('User', userSchema);

export default User;
