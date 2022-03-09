const getSMA = (periods, candles) => {

    let closePriceSum = 0;
    candles.forEach((candle) => {
        closePriceSum += parseFloat(candle.closePrice);
    })
    return closePriceSum / periods;
}

module.exports = {
    getSMA: getSMA
}