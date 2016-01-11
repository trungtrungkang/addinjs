module.exports = function (sandbox) {
    var core = sandbox.core;
    var utils = core.utils;
    var logger = core.logger;

    //Default doozers
    var classDoozer = {
        handleCondition: true,
        buildItem: function (args, done) {
            var codon = args.codon;
            var point = codon.props.get('point');

            this.loadRuntime(args, function (obj) {
                if (!utils.isNullOrEmpty(point)) {
                    obj = utils.getValue(obj, point);
                }
                done(obj);
            });
        },
        loadRuntime: function (args, cb) {
            var codon = args.codon;
            var path = codon.props.get('path');
            var from = codon.props.get('from');
            if (!utils.isNullOrEmpty(path) && !utils.isNullOrEmpty(from)) {
                throw logger.error("The Class codon doesn't declare attribute 'path' or 'from'.");
            }

            if (!utils.isNullOrEmpty(path)) {
                sandbox.requirejs([path], function (fn) {
                    var instance = fn(sandbox);
                    cb(instance);
                });
            } else {
                var addin = codon.addIn;
                if (codon.props.addin) addin = sandbox.getAddIn(codon.props.addin);

                var runtime = sandbox.runtimes.get(from, addin);
                if (!runtime)
                    throw logger.error("ClassDoozer Exception: Cannot find module [" + from + "] in runtimes.");
                runtime.ready(cb);
            }
        }
    };

    /**
     * IncludeDoozer allows building codons that come from other places.
     */
    var includeDoozer = {
        handleCondition: true,
        buildItem: function (args, callback) {
            var item = args.codon.props.get('item');
            var path = args.codon.props.get('path');
            var node;

            if (!utils.isNullOrEmpty(item)) {
                node = sandbox.get(item);
                if (!node)
                    throw logger.error("IncludeDoozer Exception: Cannot find the node with item [{0}]", item);
                node.buildItem({ parameter: args.parameter, conditions: args.conditions }, callback);
            } else if (!utils.isNullOrEmpty(path)) {
                node = sandbox.get(path);
                if (!node)
                    throw logger.error("IncludeDoozer Exception: Cannot find the node with path [{0}]", path);
                node.buildItems({ parameter: args.parameter, conditions: args.conditions }, function (items) {
                    callback(items, true);
                });
            }
        }
    };

    var listenDoozer = {
        buildItem: function (args) {
            var codon = args.codon;
            var props = codon.props;
            var event = props.event;
            sandbox.bus.on(event, $.proxy(this.createHandler(props.addin || codon.addIn.name, props.runtime, props.point), 'onEvent'));
        },
        createHandler: function (addinName, runtimeName, point) {
            return {
                onEvent: function () {
                    var addin = sandbox.getAddIn(addinName);
                    var runtime = sandbox.getRuntime(runtimeName, addin);
                    var ctx = this;

                    runtime.ready(function (instance) {
                        var fn = utils.getValue(instance, point);
                        fn.apply(ctx, arguments);
                        ctx = null;
                    });
                }
            };
        }
    };

    //default condition evaluators
    var hiddenEvaluator = {
        validate: function (args, callback) {
            callback(false);
        }
    };

    return {
        doozers: {
            Class: classDoozer,
            Listen: listenDoozer,
            Include: includeDoozer
        },
        evaluators: {
            Hidden: hiddenEvaluator
        }
    };
};