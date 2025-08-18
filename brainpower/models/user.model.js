// models/Organization.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: Number, required: true },
    gender: { type: String, required: true, enum: ['male', 'female'] },
    profile: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('user', UserSchema);
