const fs = require('fs')

const save = (data) => {
    let filepath = 'logs/log.txt'
    let text = ''

    if (typeof data === 'string') {
        text = data
    } else {
        text = JSON.stringify(data, null, 4)
    }

    fs.appendFileSync(filepath, text, (error) => {
        if (error)  (error.message)
    })
}

module.exports = {
    save: save
}
