const moment = require('moment');
const request = require('../model/request');
const socket = require('../model/socket');

let openTrade = null

const doScalpTrade = async (strategy, lastClosedCandle) => {

    let hasOpenTrade = openTrade !== null

    if (!hasOpenTrade) {
        console.log('\n--------------------------------------------------------\n')
        console.log(`---> Sinal de COMPRA em ${strategy.pair} às ${moment().format('HH:mm:ss')}`);

        let result = await request.openNewOrder(strategy.pair, 'BUY', 'MARKET', strategy.tradeAmount);
        console.log('Ordem a Mercado:');
        console.log(result);
        
        let buyPrice = calculateBuyPrice(result.fills);
        let stopPrice = calculateStopPrice(lastClosedCandle, strategy);
        let targetPrice = calculateTargetPrice(buyPrice, stopPrice);
        
        let stopResult = await request.openNewOrder(strategy.pair, 'SELL', 'STOP_LOSS_LIMIT', strategy.tradeAmount, stopPrice);
        let takeProfitResult = await request.openNewOrder(strategy.pair, 'SELL', 'TAKE_PROFIT_LIMIT', strategy.tradeAmount, targetPrice);
        
        console.log(`RESULTADO DA ORDEM STOP`)
        console.log(stopResult)
        console.log(`RESULTADO DA ORDEM TAKE PROFIT`)
        console.log(takeProfitResult)
        
        openTrade = {
            entry: buyPrice,
            target: targetPrice,
            targetOrderId: takeProfitResult.orderId,
            stop: stopPrice,
            stopOrderId: stopResult.orderId
        }
        
        console.log('Open Trade')
        console.log(openTrade)
        console.log('\n--------------------------------------------------------\n')

        socket.subscribeKline(strategy.pair, strategy.timeInterval)
        let webSocket = socket.getSocket()
        webSocket.onmessage = (event) => {
            handleSocketMessage(event.data)
        }
    }
}

const handleSocketMessage = (data) => {
    console.log(data)
}

const calculateBuyPrice = (orderFills) => {
    let pricesSum = 0;
    orderFills.forEach( fill => {
        pricesSum += parseFloat(fill.price);
    });
    return parseFloat((pricesSum / orderFills.length).toFixed(1));
}

const calculateStopPrice = (lastClosedCandle, strategy) => {
    return parseFloat((lastClosedCandle.lowPrice - strategy.stopMargin).toFixed(1));
}

const calculateTargetPrice = (buyPrice, stopPrice) => {
    return parseFloat((buyPrice + (buyPrice - stopPrice)).toFixed(1))
}

module.exports = {
    doScalpTrade: doScalpTrade
}
