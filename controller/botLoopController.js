const moment = require('moment');
const util = require('../lib/util');
const request = require('../model/request');
const socket = require('../model/socket');
const smaIndicator = require('../indicators/sma');
const candleController = require('../controller/candleController');
const tradeController = require('../controller/tradeController');

const forever = true;
let strategy;
let candlesNumber;
let candles;

const startBotLoop = async (paramStrategy) => {
    strategy = paramStrategy;
    // Quando houver varias estrategias, candlesNumber tera que ser o maior periods dentre todas as estrategias + 1
    if (strategy.useTrendConfirmation) {
        candlesNumber = strategy.trendConfirmationPeriods + 1;
    } else {
        candlesNumber = strategy.periods + 1;
    }

    socket.connectWebSocket()
    let socketSuccess = await socket.isConnected()
    if (socketSuccess) {
        botLoop();
    } else {
        console.log('Nao foi possivel iniciar o socket, aplicacao encerrada')
    }
}

const botLoop = async () => {

    console.log(`Stalker Bot iniciado com sucesso às ${moment().format('HH:mm:ss')}`);

    // Bloco de verificações da conta usado apenas durante desenvolvimento.
    let accountData = await request.getAccountInformation();
    console.log(accountData);
    let allOrders = await request.getAllOrders(strategy.pair);
    allOrders = allOrders.filter(order => order.status === 'NEW')
    console.log(allOrders);

    do {

        // Calcula quando deve requisitar novos dados de candles
        let currentTime = moment();
        let nextCandleTime = candleController.calculateNextCandleTime(moment(), strategy);
        let sleepTime = (nextCandleTime.unix() - currentTime.unix()) * 1000;
        await util.sleep(sleepTime);
     
        // Busca os candles recentes
        let rawCandleData = null;
        try {
            rawCandleData = await request.getCandles(strategy.pair, strategy.timeInterval, candlesNumber);
        } catch (error) {
            console.log('Nao foi possivel trazer as informacoes dos ultimos candles')
            console.log(error.message)
        }

        if (rawCandleData) {

            candles = candleController.buildCandleData(rawCandleData);
    
            // Verifica se o ultimo candle esta fechado e o remove do array de dados caso ainda estiver aberto
            let lastCandleCloseTime = candles[candles.length - 1].closeTime;
            if (lastCandleCloseTime > (moment().unix() * 1000)) {
                candles.pop();
            } else {
                candles.shift();
            }
    
            // console.log (
            //     `Hora atual: ${moment().format('HH:mm:ss')}. Recebido candle com hora de fechamento: ` + 
            //     `${moment(candles[candles.length - 1].closeTime).format('HH:mm:ss')}`
            // );
    
            // Executa a(s) estratégia(s) parametrizada(s)
            let sma = smaIndicator.getSMA(strategy.periods, candles);
            let confirmationSma = smaIndicator.getSMA(strategy.trendConfirmationPeriods, candles);
            let lastClosedCandle = candles[candles.length - 1];
    
            if (lastClosedCandle.openPrice < sma
                    && lastClosedCandle.closePrice > sma 
                    && (!strategy.useTrendConfirmation || (lastClosedCandle.closePrice > confirmationSma && sma > confirmationSma))
                ){
                tradeController.doScalpTrade(strategy, lastClosedCandle);
            }
    
            registerLogs(sma, confirmationSma);
        }

    } while (forever)
}

// Funcao de debug para utilizacao apenas durante o desenvolvimento
const registerLogs = (sma, confirmationSma) => {
    // console.log('-')
    // console.log(`A SMA rápida é: ${sma}`);
    // console.log(`A SMA lenta (confirmação) é: ${confirmationSma}`);
    // console.log(`Ultimo candle fechado: open ${candles[candles.length - 1].openPrice} `
    //     + `high ${candles[candles.length - 1].highPrice} low ${candles[candles.length - 1].lowPrice} `
    //     + `close ${candles[candles.length - 1].closePrice}`
    // );
}

module.exports = {
    startBotLoop:  startBotLoop
}
