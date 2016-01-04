var utils = require('./utils');
var logger = require('./logger');

/**
 * The class that allow to load and instantiate Evaluator class on-demand(lazy loading).
 * @param {String} name
 * @param {String} point
 * @param {Runtime} runtime
 */
function LazyLoadEvaluator(runtime, name, point) {
    this.name = name;
    this.point = point;
    this.runtime = runtime;
}
LazyLoadEvaluator.prototype = {
    validate: function (args, callback) {
        var point = this.point;
        var runtime = this.runtime;
        var name = this.name;

        runtime.ready(function (instance) {
            var evaluator = utils.getValue(instance, point);
            if (!evaluator)
                throw logger.error("Loading Condition Evaluator failed. Cannot load ConditionEvaluator " + name + " from the " + runtime.name + " runtime.");
            evaluator.validate(args, callback);
        });
    }
};

module.exports = LazyLoadEvaluator;