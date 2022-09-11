const crypto = require('crypto')
const config = require('../config')

module.exports = {
    sleep: (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    },

    breakReference: (obj) => {
        return JSON.parse(JSON.stringify(obj))
    },

    buildSignature: (queryString) => {
        let apiSecret = config.api.secretKey
        return crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex')
    }
}