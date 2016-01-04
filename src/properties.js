var utils = require('./utils');

function Properties() {}

/**
 * Instantiates Properties object from xml.
 * @param {XmlObject} reader
 * @returns {Properties}
 */
Properties.read = function (reader) {
    var props = new Properties();
    if (reader.current) {
        var attrs = reader.current.attributes;
        utils.each(attrs, function (attr) {
            var name = attr.nodeName, val = attr.nodeValue;
            props.set(name, val);
        });
    }

    return props;
};

Properties.prototype = {
    set: function (name, val) {
        this[name] = val;
    },
    get: function (name, defaultValue) {
        var val = this[name];
        return (val === undefined) ? defaultValue : val;
    }
};

module.exports = Properties;