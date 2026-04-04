const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
    chave: { type: String, default: 'global' },
    pixProvedor: { type: String, default: 'mercadopago' },
    pixToken: String,
    pixClientId: String,
    pixClientSecret: String
});

module.exports = mongoose.model('Config', ConfigSchema);