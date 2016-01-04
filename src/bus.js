var utils = require('./utils');
var events = {};

module.exports = {
    on: function (name, fn, ctx, once) {
        var names = name.split(' ');
        for (var i = 0; i < names.length; i++) {
            var _name = names[i];
            var handlers = events[_name];
            if (!handlers) {
                handlers = [];
                events[_name] = handlers;
            }

            handlers.push({ once: (once === true), fn: fn, ctx: ctx });
        }
        return this;
    },
    once: function (name, fn, ctx) {
        this.on(name, fn, ctx, true);
        return this;
    },
    off: function (name, fn) {
        var names = name.split(' ');
        for (var l = 0; l < names.length; l++) {
            var _name = names[l];
            var handlers = events[_name];
            if (handlers) {
                if (!fn)
                    delete events[_name];
                else {
                    for (var i = 0; i < handlers.length; i++) {
                        var h = handlers[i];
                        if (h.fn === fn || (h.fn.guid !== undefined && h.fn.guid === fn.guid)) {
                            handlers.splice(i, 1);
                        }
                    }

                    if (handlers.length === 0)
                        delete events[_name];
                }
            }
        }
        return this;
    },
    raise: function (name, arg1, argN) {
        var names = name.split(' ');
        for (var l = 0; l < names.length; l++) {
            var _name = names[l];
            var handlers = events[_name];
            if (handlers) {
                for (var i = 0; i < handlers.length; i++) {
                    var h = handlers[i];
                    var args = utils.copy([], arguments, 1);
                    var result = h.fn.apply(h.ctx || this, args);
                    if (h.once)
                        handlers.splice(i, 1);
                    if (result === false)
                        break;
                }
            }
        }

        return this;
    }
};