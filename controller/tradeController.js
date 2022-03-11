const moment = require('moment');

const doScalpTrade = (strategy) => {
    console.log(`Sinal de COMPRA em ${strategy.pair} às ${moment().format('HH:mm:ss')}`);
}

module.exports = {
    doScalpTrade: doScalpTrade
}
