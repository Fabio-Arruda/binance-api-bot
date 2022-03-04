const request = require('../model/request');

let candlesNumber;
let symbol;
let interval;
let candles;

const startBotLoop = (strategy) => {
    // Quando houver varias estrategias, candlesNumber tera que ser o maior periods dentre todas as estrategias
    candlesNumber = strategy.periods;
    symbol = strategy.pair;
    interval = strategy.timeInterval;
   
    botLoop();
}

const botLoop = async () => {
    
    let rawCandleData = await request.getCandles(symbol, interval, candlesNumber);
    candles = buildCandleData(rawCandleData);

    candles.forEach((candle) => {
        console.log(candle);

    })
    
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