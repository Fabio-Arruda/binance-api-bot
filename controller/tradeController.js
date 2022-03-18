const moment = require('moment');
const request = require('../model/request');

const doScalpTrade = async (strategy) => {
    console.log(`---> Sinal de COMPRA em ${strategy.pair} às ${moment().format('HH:mm:ss')}`);

    let result = await request.openNewOrder(strategy.pair, 'BUY', 'MARKET', strategy.tradeAmount);
    console.log(result);

    // calcular os valores de alvo e stop
    // transmitir a ordem de stop gain e loss





}

module.exports = {
    doScalpTrade: doScalpTrade
}
