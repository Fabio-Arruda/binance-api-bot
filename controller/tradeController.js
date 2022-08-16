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
            symbol: strategy.pair,
            timeInterval: strategy.timeInterval,
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
            handleSocketMessage(event)
        }
    }
}

const handleSocketMessage = (event) => {
    let data = JSON.parse(event.data)
    if (data.e === 'kline') {
        followTrade(data)
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

const followTrade = async (data) => {

    console.log('-> ws')

    try {
        let currentCandleMaxPrice = data.k.h
        let currentCandleMinPrice = data.k.l

        if (openTrade && currentCandleMaxPrice >= openTrade.target) {
            // verifica se executou a ordem alvo
            let checkOrderResponse = await request.checkOrder(openTrade.symbol, openTrade.targetOrderId)
            console.log('checkOrderResponse')
            console.log(checkOrderResponse)

            // se sim, cancela a ordem stop
            if (checkOrderResponse.status === 'FILLED') {
                console.log('O TAKE PROFIT foi executado')
                let cancelOrderResponse = await request.cancelOrder(openTrade.symbol, openTrade.stopOrderId)
                console.log('cancelOrderResponse')
                console.log(cancelOrderResponse)
                
                if (cancelOrderResponse.status === 'CANCELED') {
                    console.log('Ordem STOP cancelada')
                    socket.unsubscribeKline(openTrade.symbol, openTrade.timeInterval)
                    openTrade = null
                    // tem que remover o onmessage anterior???
                }
            }
        }
        
        if (openTrade && currentCandleMinPrice <= openTrade.stop) {
            // verifica se executou a ordem stop
            let checkOrderResponse = await request.checkOrder(openTrade.symbol, openTrade.stopOrderId)
            console.log('checkOrderResponse')
            console.log(checkOrderResponse)
            
            // se sim, cancela a ordem alvo
            if (checkOrderResponse.status === 'FILLED') {
                console.log('O STOP foi executado')
                let cancelOrderResponse = await request.cancelOrder(openTrade.symbol, openTrade.targetOrderId)
                console.log('cancelOrderResponse')
                console.log(cancelOrderResponse)
                
                if (cancelOrderResponse.status === 'CANCELED') {
                    console.log('Ordem TAKE PROFIT cancelada')
                    socket.unsubscribeKline(openTrade.symbol, openTrade.timeInterval)
                    openTrade = null
                    // tem que remover o onmessage anterior???
                }
            }
        } 
    } catch (error) {
        console.log(error.message)
    } 
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
