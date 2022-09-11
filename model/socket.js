const WebSocket = require('ws')
const config = require('../config')
const util = require('../lib/util')
const tradeController = require('../controller/tradeController')

let socketBaseEndpoint = config.api.socketBaseEndpoint
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

    webSocket.onmessage = (event) => {
        handleSocketMessage(event)
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

const unsubscribeKline = (symbol, interval) => {
    webSocket.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: [`${symbol.toLowerCase()}@kline_${interval}`],
        id: 2
    }))
}

const handleSocketMessage = (event) => {
    let data = JSON.parse(event.data)
    if (data.e === 'kline') {
        tradeController.followTrade(data)
    } else {
        if (data.result === null && data.id === 1) {
            console.log('Websocket SUBSCRIBE')
        } else if (data.result === null && data.id === 2) {
            console.log('Websocket UNSUBSCRIBE')
        } else {
            console.log(data)
        }
    }
}

module.exports = {
    connectWebSocket: connectWebSocket,
    isConnected: isConnected,
    getSocket: getSocket,
    subscribeKline: subscribeKline,
    unsubscribeKline: unsubscribeKline
}
