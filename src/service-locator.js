 var utils = require('./utils');
 var logger = require('./logger');
 var evaluators = require('./evaluators');
 
 var _services = {
     //default services
     evaluators: evaluators
 };
 
 module.exports = {
    get: function (name, throwError) {
        var service = _services[name];
        if (!service && throwError !== false)
            throw logger.error("Service {0} doesn't exist.", name);
        return service;
    },
    set: function (name, service) {
        var items;
        if (arguments.length === 2) {
            items = {};
            items[name] = service;
        } else
            items = arguments[0];

        utils.each(items, function (service, name) {
            _services[name] = service;
        });
    }
 };