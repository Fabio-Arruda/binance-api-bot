const axios = require('axios');
const config = require('../config');

let baseAPI = config.api.baseEndpoint;
let endpoint = config.endpoint;

const getCandles = async (symbol, interval, candlesNumber) => {
    try {
        let response = await axios({
            method: 'get',
            url: baseAPI + endpoint.candlestickData,
            params: {
                symbol: symbol,
                interval: interval,
                limit: candlesNumber
            }
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getCandles: getCandles
}