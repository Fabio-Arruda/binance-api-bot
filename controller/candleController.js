const calculateNextCandleTime = (currentTime, strategy) => {
    let minutes = currentTime.minutes() + 1
    let candleInterval = 1
    if (strategy.timeInterval === '5m') candleInterval = 5
    
    while (minutes % candleInterval !== 0) {
        minutes++
    }

    let nextCandleTime = currentTime.set({'minute': minutes, 'second': 00})
    return nextCandleTime
}

const buildCandleData = (rawCandleData) => {
    let candles = []

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

        candles.push(current)  
    })
    return candles
}

module.exports = {
    calculateNextCandleTime: calculateNextCandleTime,
    buildCandleData: buildCandleData
}
