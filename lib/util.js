module.exports = {
    sleep: (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    },

    breakReference: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    }
}