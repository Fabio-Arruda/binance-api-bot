const moment = require('moment')
const request = require('../model/request')

let socket = null
let openTrade = null

const doScalpTrade = async (strategy, lastClosedCandle) => {
    let hasOpenTrade = openTrade !== null

    if (!hasOpenTrade) {
        console.log('\n--------------------------------------------------------\n')
        console.log(`---> Sinal de COMPRA em ${strategy.pair} às ${moment().format('HH:mm:ss')}`)

        let result = null
        try {
            result = await request.openNewOrder(strategy.pair, 'BUY', 'MARKET', strategy.tradeAmount)
        } catch (error) {
            console.log('Nao foi possivel posicionar a nova ordem') 
        }
        
        if (result != null && result.fills) {
            let buyPrice = calculateBuyPrice(result.fills)
            let stopPrice = calculateStopPrice(lastClosedCandle, strategy)
            let targetPrice = calculateTargetPrice(buyPrice, stopPrice, strategy)
            
            let stopResult = {}
            try {
                stopResult = await request.openNewOrder(strategy.pair, 'SELL', 'STOP_LOSS_LIMIT', strategy.tradeAmount, stopPrice)
            } catch (error) {
                console.log('Nao foi possivel posicionar o STOP') 
            }
            
            let takeProfitResult = {}
            try {
                takeProfitResult = await request.openNewOrder(strategy.pair, 'SELL', 'TAKE_PROFIT_LIMIT', strategy.tradeAmount, targetPrice)
            } catch (error) {
                console.log('Nao foi possivel posicionar o TAKE PROFIT')
            }

            openTrade = {
                symbol: strategy.pair,
                timeInterval: strategy.timeInterval,
                entry: buyPrice,
                target: targetPrice,
                targetOrderId: takeProfitResult.orderId ? takeProfitResult.orderId : 'NA',
                stop: stopPrice,
                stopOrderId: stopResult.orderId ? stopResult.orderId : 'NA'
            }
            
            console.log(openTrade)
            console.log('\n--------------------------------------------------------\n')

            if (socket && socket.subscribeKline) {
                socket.subscribeKline(strategy.pair, strategy.timeInterval)
            } else {
                socket = require('../model/socket')
                socket.subscribeKline(strategy.pair, strategy.timeInterval)
            }
        } 
    }
}

const followTrade = async (data) => {
    try {
        let currentCandleMaxPrice = data.k.h
        let currentCandleMinPrice = data.k.l

        if (openTrade && currentCandleMaxPrice >= openTrade.target) {
            // verifica se executou a ordem alvo
            let checkOrderResponse = await request.checkOrder(openTrade.symbol, openTrade.targetOrderId)

            // se sim, cancela a ordem stop
            if (checkOrderResponse.status === 'FILLED') {
                console.log('O TAKE PROFIT foi executado')
                let cancelOrderResponse = await request.cancelOrder(openTrade.symbol, openTrade.stopOrderId)
                
                if (cancelOrderResponse.status === 'CANCELED') {
                    console.log('Ordem STOP cancelada')
                    socket.unsubscribeKline(openTrade.symbol, openTrade.timeInterval)
                    openTrade = null
                }
            }
        }
        
        if (openTrade && currentCandleMinPrice <= openTrade.stop) {
            // verifica se executou a ordem stop
            let checkOrderResponse = await request.checkOrder(openTrade.symbol, openTrade.stopOrderId)
            
            // se sim, cancela a ordem alvo
            if (checkOrderResponse.status === 'FILLED') {
                console.log('O STOP foi executado')
                let cancelOrderResponse = await request.cancelOrder(openTrade.symbol, openTrade.targetOrderId)
                
                if (cancelOrderResponse.status === 'CANCELED') {
                    console.log('Ordem TAKE PROFIT cancelada')
                    socket.unsubscribeKline(openTrade.symbol, openTrade.timeInterval)
                    openTrade = null
                }
            }
        } 
    } catch (error) {
        console.log(error.message)
    } 
}

const calculateBuyPrice = (orderFills) => {
    let pricesSum = 0
    orderFills.forEach( fill => {
        pricesSum += parseFloat(fill.price)
    })
    return parseFloat((pricesSum / orderFills.length).toFixed(1))
}

const calculateStopPrice = (lastClosedCandle, strategy) => {
    return parseFloat((lastClosedCandle.lowPrice - strategy.stopMargin).toFixed(1))
}

const calculateTargetPrice = (buyPrice, stopPrice, strategy) => {
    return parseFloat((buyPrice + (buyPrice - stopPrice) * strategy.takeProfitMultiplier).toFixed(1))
}

module.exports = {
    doScalpTrade: doScalpTrade,
    followTrade: followTrade
}
