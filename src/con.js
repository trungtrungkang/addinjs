var utils = require('./utils');
var logger = require('./logger');
var Properties = require('./Properties');
var services = require('./service-locator');
var xml = require('./xml');
var XmlNodeType = xml.XmlNodeType;

var ConditionFailedAction = {
    Nothing: "nothing",
    Exclude: "exclude",
    Disable: "disable"
};

function Condition(name, props, addIn) {
    this.name = name;
    this.props = props;
    this.addIn = addIn;

    this.action = props.get('action', ConditionFailedAction.Exclude);
}
Condition.prototype = {
    validate: function (args, callback) {
        var name = this.name;
        var evaluators = services.get('evaluators');
        var evaluator = evaluators.get(name);
        if (!evaluator)
            throw logger.error("Condition evaluator " + name + " not found!");

        try {
            return evaluator.validate(args, callback);
        } catch (ex) {
            logger.warning("Condition evaluation failed: " + ex.message);
        }
    }
};

/**
 * Loads condition from xml reader.
 * @param {XmlObject} reader The xml reader.
 * @param {AddIn} addIn
 */
Condition.read = function (reader, addIn) {
    var props = Properties.read(reader);
    var name = props.get('name');
    if (utils.isNullOrEmpty(name))
        throw logger.error("The Condition node requires attribute 'name'.");
    return new Condition(name, props, addIn);
};

/**
 * Loads complex conditions from xml reader.
 * @param {XmlObject} reader the xml reader.
 * @param {type} addIn
 */
Condition.readComplexCondition = function (reader, addIn) {
    var condition;
    while (reader.read()) {
        var current = reader.current;
        var nodeType = reader.nodeType;
        var name = current.localName;

        switch (nodeType) {
            case XmlNodeType.Element:
                switch (name) {
                    case "And":
                        condition = AndCondition.read(reader, addIn);
                        break;
                    case "Or":
                        condition = OrCondition.Read(reader, addIn);
                        break;
                    case "Not":
                        condition = NotCondition.Read(reader, addIn);
                        break;
                    default:
                        throw new Error("Invalid element name '" + name + "', the first entry in a ComplexCondition " +
                            "must be <And>, <Or> or <Not>");
                }
        }
    }
};

Condition.readConditionList = function (reader, endElement, addIn) {
    var conditions = [];
    while (reader.read()) {
        var current = reader.current;
        var nodeType = reader.nodeType;
        var name = current.localName;

        switch (nodeType) {
            case XmlNodeType.EndElement:
                if (name === endElement) {
                    return conditions;
                }
                break;
            case XmlNodeType.Element:
                switch (name) {
                    case "And":
                        conditions.push(AndCondition.read(reader, addIn));
                        break;
                    case "Or":
                        conditions.push(OrCondition.read(reader, addIn));
                        break;
                    case "Not":
                        conditions.push(NotCondition.read(reader, addIn));
                        break;
                    case "Condition":
                        conditions.push(Condition.read(reader, addIn));
                        break;
                    default:
                        throw new Error("Invalid element name '" + name + "', entries in a <" + endElement + "> " + "must be <And>, <Or>, <Not> or <Condition>");
                }
                break;
        }
    }

    return conditions;
};

Condition.getFailedAction = function (args, callback) {
    var action = ConditionFailedAction.Nothing;
    var conditionList = args.conditions;

    utils.async.each(conditionList, function (condition, i, next, finish) {
        condition.validate(args, function (isValid) {
            if (!isValid) {
                if (condition.action === ConditionFailedAction.Disable) {
                    action = ConditionFailedAction.Disable;
                    next();
                } else {
                    action = ConditionFailedAction.Exclude;
                    finish();
                }
            } else
                next();
        });
    }, function () {
        if (callback)
            callback(action);
    });
};

var AndCondition = function (conditions) {
    this.validate = function (args, callback) {
        var valid = true;
        utils.async.each(conditions, function (condition, i, next, finish) {
            condition.validate(args, function (isValid) {
                if (!isValid) {
                    valid = false;
                    finish();
                } else
                    next();
            });
        }, function () {
            callback(valid);
        });
    };
};

AndCondition.read = function (reader, addin) {
    return new AndCondition(Condition.readConditionList(reader, "And", addin));
};

var NotCondition = function (condition) {
    this.validate = function (args, callback) {
        condition.validate(args, function (isValid) {
            callback(!isValid);
        });
    };
};

NotCondition.read = function (reader, addin) {
    return new NotCondition(Condition.readConditionList(reader, 'Not', addin)[0]);
};

var OrCondition = function (conditions) {
    this.validate = function (args, callback) {
        var valid = false;
        utils.async.each(conditions, function (condition, i, next, finish) {
            condition.validate(function (isValid) {
                if (isValid) {
                    valid = true;
                    finish();
                } else
                    next();
            });
        },
        function () {
            callback(valid);
        });
    };
};

OrCondition.read = function (reader, addin) {
    return new OrCondition(Condition.readConditionList(reader, "Or", addin));
};

module.exports = {
    ConditionFailedAction: ConditionFailedAction,
    Condition: Condition,
    AndCondition: AndCondition,
    NotCondition: NotCondition,
    OrCondition: OrCondition
};