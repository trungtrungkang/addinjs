var utils = require('./utils');

module.exports = {
    warning: function (msg, args) {
        var s = utils.format(msg, args);
        console.log('Warning: ' + s);
    },
    error: function (msg, args) {
        var s = utils.format(msg, args);
        return new Error(s);
    }
};