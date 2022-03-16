const axios = require('axios');
const moment = require('moment');
const config = require('../config');
const util = require('../lib/util');

let baseAPI = config.api.baseEndpoint;
let endpoint = config.endpoint;
let apiKey = config.api.apiKey;

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

const getAccountInformation = async () => {
    
    let timestamp = moment().unix() * 1000;
    let queryString = `timestamp=${timestamp}`;
    let signature = util.buildSignature(queryString); //falta passar a assinatura para o axios

    try {
        let response = await axios({
            method: 'get',
            url: baseAPI + endpoint.accountInformation,
            headers: {
                'X-MBX-APIKEY': apiKey
            },
            params: {
                timestamp: timestamp,
                signature: signature
            }
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getCandles: getCandles,
    getAccountInformation: getAccountInformation
}
