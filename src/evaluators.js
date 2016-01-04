var LazyLoadEvaluator = require('./lazyloadevaluator');

/**
 * A collection of Condition Evaluator objects.
 * */
var _evaluators = {};

module.exports = {
    set: function (name, evaluator) {
        _evaluators[name] = evaluator;
    },
    get: function (name) {
        return _evaluators[name];
    }
};