const moment = require('moment');
const request = require('../model/request');

const doScalpTrade = async (strategy, lastClosedCandle) => {

    console.log(`---> Sinal de COMPRA em ${strategy.pair} às ${moment().format('HH:mm:ss')}`);

    let result = await request.openNewOrder(strategy.pair, 'BUY', 'MARKET', strategy.tradeAmount);
    console.log('Ordem a Mercado:');
    console.log(result);

    let buyPrice = calculateBuyPrice(result.fills);
    let stopPrice = calculateStopPrice(lastClosedCandle, strategy);
    let targetPrice = calculateTargetPrice(buyPrice, stopPrice);

    console.log(`O valor de compra é ${buyPrice}`)
    console.log(`STOP: ${stopPrice}`)
    console.log(`Alvo: ${targetPrice}`)
}

const calculateBuyPrice = (orderFills) => {
    let pricesSum = 0;
    orderFills.forEach( fill => {
        pricesSum += fill.price;
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
