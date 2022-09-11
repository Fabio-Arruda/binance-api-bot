const axios = require('axios')
const moment = require('moment')
const config = require('../config')
const util = require('../lib/util')

let baseAPI = config.api.baseEndpoint
let endpoint = config.endpoint
let apiKey = config.api.apiKey

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
        })
        return response.data
    } catch (error) {
        console.log(error.message)
    }
}

const getAccountInformation = async () => {
    
    let timestamp = moment().unix() * 1000
    let queryString = `timestamp=${timestamp}`
    let signature = util.buildSignature(queryString)

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
        })
        return response.data
    } catch (error) {
        console.log(error.message)
    }
}

const openNewOrder = async (symbol, side, type, quantity, stopPrice) => {
    
    let timestamp = moment().unix() * 1000
    let queryString = `symbol=${symbol}&side=${side}&type=${type}&quantity=${quantity}`
    let params = {
        symbol: symbol,
        side: side,
        type: type,
        quantity: quantity
    }

    if (type === 'STOP_LOSS_LIMIT' || type === 'TAKE_PROFIT_LIMIT') {
        params.stopPrice = stopPrice
        params.price = stopPrice
        params.timeInForce = 'GTC' // "Good Til Canceled". A ordem permanecerá no book de ofertas até ser cancelada.
        queryString += `&stopPrice=${stopPrice}&price=${stopPrice}&timeInForce=${params.timeInForce}`
    }

    params.timestamp = timestamp
    queryString += `&timestamp=${timestamp}`

    let signature = util.buildSignature(queryString)
    params.signature = signature
    
    try {
        let response = await axios({
            method: 'post',
            url: baseAPI + endpoint.order,
            headers: {
                'X-MBX-APIKEY': apiKey
            },
            params: params
        })
        return response.data
    } catch (error) {
        console.log(error.message)
    }
}

const getAllOrders = async (symbol) => {

    let timestamp = moment().unix() * 1000
    let queryString = `symbol=${symbol}&timestamp=${timestamp}`
    let signature = util.buildSignature(queryString)

    try {
        let response = await axios({
            method: 'get',
            url: baseAPI + endpoint.getAllOrders,
            headers: {
                'X-MBX-APIKEY': apiKey
            },
            params: {
                symbol: symbol,
                timestamp: timestamp,
                signature: signature
            }
        })
        return response.data
    } catch (error) {
        console.log(error.message)
    }
}

const checkOrder = async (symbol, orderId) => {

    let timestamp = moment().unix() * 1000
    let queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`
    let signature = util.buildSignature(queryString)

    try {
        let response = await axios({
            method: 'get',
            url: baseAPI + endpoint.order,
            headers: {
                'X-MBX-APIKEY': apiKey
            },
            params: {
                symbol: symbol,
                orderId: orderId,
                timestamp: timestamp,
                signature: signature
            }
        })
        return response.data
    } catch (error) {
        console.log(error.message)
    }
}

const cancelOrder = async (symbol, orderId) => {

    let timestamp = moment().unix() * 1000
    let queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`
    let signature = util.buildSignature(queryString)

    try {
        let response = await axios({
            method: 'delete',
            url: baseAPI + endpoint.order,
            headers: {
                'X-MBX-APIKEY': apiKey
            },
            params: {
                symbol: symbol,
                orderId: orderId, 
                timestamp: timestamp,
                signature: signature
            }
        })
        return response.data
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    getCandles: getCandles,
    openNewOrder: openNewOrder,
    getAccountInformation: getAccountInformation,
    getAllOrders: getAllOrders,
    checkOrder: checkOrder,
    cancelOrder: cancelOrder
}
