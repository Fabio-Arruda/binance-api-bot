const dotenv = require('dotenv');
dotenv.config();

const config = {

    api: {
        // Production endpoint
        // baseEndpoint: 'https://api.binance.com',
        // socketBaseEndpoint: 'wss://stream.binance.com:9443',
        // Spot test Binance endpoint
        baseEndpoint: 'https://testnet.binance.vision',
        socketBaseEndpoint: 'wss://testnet.binance.vision',
        apiKey: process.env.API_KEY,
        secretKey: process.env.SECRET_KEY,
    },
    
    endpoint: {
        systemStatus: '/sapi/v1/system/status',
        exchangeInfo: '/api/v3/exchangeInfo',
        candlestickData: '/api/v3/klines',
        accountInformation: '/api/v3/account',
        newOrder: '/api/v3/order',
        getAllOrders: '/api/v3/allOrders'
    },

    strategy: {
        name: 'sma',
        pair: 'BNBUSDT', // BNBBTC ETHBTC BNBUSDT BTCUSDT ETHUSDT
        periods: 9,
        timeInterval: '5m',
        stopMargin: 0.1,
        tradeAmount: 1,
        useTrendConfirmation: true,
        trendConfirmationPeriods: 50,
        active: true // vai ser usado futuramente para indicar quais estrategias estao habilitadas/desabilitadas
    }

}

module.exports = config;
