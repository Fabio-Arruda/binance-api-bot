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
    // Quando houver varias estrategias, candlesNumber tera que ser o maior periods dentre todas as estrategias + 1
    candlesNumber = strategy.periods + 1;
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

        // Verifica se o ultimo candle esta fechado e o remove do array de dados caso ainda estiver aberto
        let lastCandleCloseTime = candles[candles.length - 1].closeTime;
        if (lastCandleCloseTime > (moment().unix() * 1000)) {
            candles.pop();
        } else {
            candles.shift();
        }

        console.log (
            `Hora atual: ${moment().format('HH:mm:ss')}. Recebido candle com hora de fechamento: ` + 
            `${moment(candles[candles.length - 1].closeTime).format('HH:mm:ss')}`
        );

        // Executa a(s) estratégia(s) parametrizada(s)
        let sma = smaIndicator.getSMA(strategy.periods, candles);
        let lastClosedCandle = candles[candles.length - 1];

        if (lastClosedCandle.openPrice < sma && lastClosedCandle.closePrice > sma) {
            console.log(`Sinal de COMPRA em ${strategy.pair} às ${moment().format('HH:mm:ss')}`);
        }

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
            openPrice: parseFloat(candle[1]),
            closePrice: parseFloat(candle[4]),
            highPrice: parseFloat(candle[2]),
            lowPrice: parseFloat(candle[3]),
            openTime: candle[0],
            closeTime: candle[6],
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
