const mongoose = require('mongoose');

const ApiAuthSchema = new mongoose.Schema({
    serverEnv: { type: String, required: true },
    accessKey: { type: String, required: true },
    isActive: { type: Number, require: false, default: 1 },
    createdAt: { type: Date, required: false, default: Date.now() },
    updatedAt: { type: Date, required: false, default: Date.now() },
})

module.exports = mongoose.model('apiAuth', ApiAuthSchema);
