const config = require('./config')
const botLoopController = require('./controller/botLoopController')

const strategy = config.strategy
botLoopController.startBotLoop(strategy)
