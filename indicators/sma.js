const util = require("../lib/util");

const getSMA = (periods, candles) => {

    let closePriceSum = 0;
    let candlesToCalc = util.breakReference(candles);

    if (candlesToCalc.length > periods) {
        candlesToCalc = candlesToCalc.splice(candlesToCalc.length - periods);
    }

    candlesToCalc.forEach((candle) => {
        closePriceSum += candle.closePrice;
    })

    return (closePriceSum / periods).toFixed(2);
}

module.exports = {
    getSMA: getSMA
}
