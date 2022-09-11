const moment = require('moment')
const util = require('../lib/util')
const request = require('../model/request')
const socket = require('../model/socket')
const smaIndicator = require('../indicators/sma')
const candleController = require('../controller/candleController')
const tradeController = require('../controller/tradeController')

const forever = true
let strategy
let candlesNumber
let candles

const startBotLoop = async (paramStrategy) => {
    strategy = paramStrategy

    if (strategy.useTrendConfirmation) {
        candlesNumber = strategy.trendConfirmationPeriods + 1
    } else {
        candlesNumber = strategy.periods + 1
    }

    socket.connectWebSocket()
    let socketSuccess = await socket.isConnected()
    if (socketSuccess) {
        botLoop()
    } else {
        console.log('Nao foi possivel iniciar o socket, aplicacao encerrada')
    }
}

const botLoop = async () => {
    console.log(`Stalker Bot iniciado com sucesso às ${moment().format('HH:mm:ss')}`)

    // Realiza verificações na conta
    let accountData = await request.getAccountInformation()
    console.log(accountData)
    let allOrders = await request.getAllOrders(strategy.pair)
    allOrders = allOrders.filter(order => order.status === 'NEW')
    console.log(allOrders)

    do {
        // Calcula quando deve requisitar novos dados de candles
        let currentTime = moment()
        let nextCandleTime = candleController.calculateNextCandleTime(moment(), strategy)
        let sleepTime = (nextCandleTime.unix() - currentTime.unix()) * 1000
        await util.sleep(sleepTime)
     
        // Busca os candles recentes
        let rawCandleData = null
        try {
            rawCandleData = await request.getCandles(strategy.pair, strategy.timeInterval, candlesNumber)
        } catch (error) {
            console.log('Nao foi possivel trazer as informacoes dos ultimos candles')
            console.log(error.message)
        }

        if (rawCandleData) {
            candles = candleController.buildCandleData(rawCandleData)
            // Verifica se o ultimo candle esta fechado e o remove do array de dados caso ainda estiver aberto
            let lastCandleCloseTime = candles[candles.length - 1].closeTime
            if (lastCandleCloseTime > (moment().unix() * 1000)) {
                candles.pop()
            } else {
                candles.shift()
            }
    
            // Executa a estratégia parametrizada
            let sma = smaIndicator.getSMA(strategy.periods, candles)
            let confirmationSma = smaIndicator.getSMA(strategy.trendConfirmationPeriods, candles)
            let lastClosedCandle = candles[candles.length - 1]
            let previousCandle = candles[candles.length - 2]
    
            let tradeConditionsOK = checkTradeConditions(lastClosedCandle, previousCandle, sma, confirmationSma)
            if (tradeConditionsOK){
                tradeController.doScalpTrade(strategy, lastClosedCandle)
            }
        }

    } while (forever)
}

const checkTradeConditions = (lastClosedCandle, previousCandle, sma, confirmationSma) => {

    let priceCrossedAverage = (lastClosedCandle.openPrice < sma && lastClosedCandle.closePrice > sma)
        || (previousCandle.openPrice < sma && lastClosedCandle.closePrice > sma)
    let worthTrade = lastClosedCandle.closePrice - lastClosedCandle.openPrice >= strategy.minWorthTrade
    let limitedRisk = lastClosedCandle.closePrice - lastClosedCandle.lowPrice <= strategy.maxRiskTrade
    let stretchedMarket = sma - confirmationSma > strategy.stretchLimit
    let hasConfirmation = !strategy.useTrendConfirmation
        || (lastClosedCandle.closePrice > confirmationSma && sma > confirmationSma && !stretchedMarket)

    return priceCrossedAverage && worthTrade && limitedRisk && hasConfirmation
}

module.exports = {
    startBotLoop:  startBotLoop
}
