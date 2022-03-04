const dotenv = require('dotenv');
dotenv.config();

const config = {

    api: {
        // Production endpoint
        baseEndpoint: 'https://api.binance.com',
        // Spot test Binance endpoint
        // baseEndpoint: 'https://testnet.binance.vision',
        apiKey: process.env.API_KEY,
        secretKey: process.env.SECRET_KEY,
    },
    
    endpoints: {
        
    }
}

module.exports = config;
