const moment = require('moment');
const util = require('../lib/util');
const request = require('../model/request');
const smaIndicator = require('../indicators/sma');

const forever = true;
let strategy;
let candlesNumber;
let candles;

const startBotLoop = (paramStrategy) => {
    strategy = paramStrategy;
    // Quando houver varias estrategias, candlesNumber tera que ser o maior periods dentre todas as estrategias
    candlesNumber = strategy.periods;
    botLoop();
}

const botLoop = async () => {

    do {

        // Calcula quando deve requisitar novos dados de candles
        let currentTime = moment();
        let nextCandleTime = calculateNextCandleTime(moment());
        let sleepTime = (nextCandleTime.unix() - currentTime.unix()) * 1000;
        await util.sleep(sleepTime);
     
        // Busca os candles recentes
        let rawCandleData = await request.getCandles(strategy.pair, strategy.timeInterval, candlesNumber);
        candles = buildCandleData(rawCandleData);
        
        // Executa a(s) estratégia(s) parametrizada(s)
        let sma = smaIndicator.getSMA(strategy.periods, candles);



        console.log(candles[candles.length - 1])
        console.log(sma)


        // passar o parse float para a hora de criar os candles formatados e retirar de dentro do calculo da sma
        // ajustar o codigo novamente para desconsiderar o ultimo candle trazido, porque acabou de abrir

    } while (forever)
}

const calculateNextCandleTime = (currentTime) => {

    let minutes = currentTime.minutes() + 1;
    let candleInterval = 1;
    if (strategy.timeInterval === '5m') candleInterval = 5;
    
    while (minutes % candleInterval !== 0) {
        minutes++;
    }

    let nextCandleTime = currentTime.set({'minute': minutes, 'second': 00});
    return nextCandleTime;
}

const buildCandleData = (rawCandleData) => {

    let candles = [];

    rawCandleData.forEach(candle => {

        current = {
            openTime: candle[0],
            closeTime: candle[6],
            openPrice: candle[1],
            closePrice: candle[4],
            highPrice: candle[2],
            lowPrice: candle[3],
            volume: candle[5],
            numberOfTrades: candle[8] 
        }
        candles.push(current);  
    });
    return candles;
}










module.exports = {
    startBotLoop:  startBotLoop
}