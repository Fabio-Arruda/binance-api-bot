const WebSocket = require('ws');
const config = require('../config');
const util = require('../lib/util');

let socketBaseEndpoint = config.api.socketBaseEndpoint;
let webSocket = null

const connectWebSocket = () => {

    webSocket = new WebSocket(socketBaseEndpoint + '/ws')

    webSocket.onopen = (event) => {
        console.log('WebSocket conectado com sucesso')
    }
    
    webSocket.onclose = (event) => {
        console.log('WebSocket fechado com sucesso')
    }
    
    webSocket.onerror = (event) => {
        console.log('Erro com o WebSocket')
        console.log(event.error)
    }
}

const isConnected = async () => {
    let tries = 1
    let maxTries = 5

    do {
        if (webSocket && webSocket.readyState === 1) {
            return true
        } else {
            tries++
            await util.sleep(1000)
        }
    } while (tries <= maxTries)
    
    return false
}

const getSocket = () => {
    return webSocket
}

const subscribeKline = (symbol, interval) => {
    webSocket.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${symbol.toLowerCase()}@kline_${interval}`],
        id: 1
    }))
}

module.exports = {
    connectWebSocket: connectWebSocket,
    isConnected: isConnected,
    getSocket: getSocket,
    subscribeKline: subscribeKline
}