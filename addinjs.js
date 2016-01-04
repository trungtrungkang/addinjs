define(function (require) {
    var utils = {
        WHITE_SPACE: ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000',
        trim: function (s) {
            s = utils.trimStart(s);
            s = utils.trimEnd(s);
            return s;
        },
        trimEnd: function (s) {
            var whitespace = this.WHITE_SPACE;
            for (var i = s.length - 1; i >= 0; i--) {
                if (whitespace.indexOf(s.charAt(i)) === -1) {
                    return s.substring(0, i + 1);
                }
            }

            return s;
        },
        trimStart: function (s) {
            var whitespace = this.WHITE_SPACE;
            for (var i = 0; i < s.length; i++) {
                if (whitespace.indexOf(s.charAt(i)) === -1) {
                    return s.substring(i);
                }
            }
            return s;
        },
        format: function () {
            var s = arguments[0];
            for (var i = 0; i < arguments.length - 1; i++) {
                var reg = new RegExp("\\{" + i + "\\}", "gm");
                s = s.replace(reg, arguments[i + 1]);
            }

            return s;
        },
        endsWith: function (s, suffix) {
            return (s.substr(s.length - suffix.length) === suffix);
        },
        startsWith: function (s, prefix) {
            return (s.substr(0, prefix.length) === prefix);
        },
        copy: function (dest, src, index) {
            var start = (index > 0) ? index : 0;
            for (var i = start; i < src.length; i++) {
                dest.push(src[i]);
            }

            return dest;
        },
        isNullOrUndefined: function (obj) {
            return obj === undefined || obj === null;
        },
        isNullOrEmpty: function (s) {
            return this.isNullOrUndefined(s) || s === '';
        },
        each: function (items, fn, ctx) {
            if (utils.isNullOrUndefined(items))
                return;
            var item, result;
            if (this.isArray(items)) {
                for (var i = 0; i < items.length; i++) {
                    item = items[i];
                    result = (ctx) ? fn.call(ctx, item, i) : fn(item, i);
                    if (result === false)
                        return;
                }
            } else {
                for (var key in items) {
                    if (items.hasOwnProperty(key)) {
                        item = items[key];
                        result = (ctx) ? fn.call(ctx, item, key) : fn(item, key);
                        if (result === false)
                            return;
                    }
                }
            }
        },
        filter: function (items, fn, ctx) {
            var results = [];
            if (utils.isNullOrUndefined(items))
                return results;

            utils.each(items, function (item, i) {
                var valid = (ctx) ? fn.call(ctx, item, i) : fn(item, i);
                if (valid === true)
                    results.push(item);
            });
            return results;
        },
        extend: function (dest, src) {
            if (!src)
                return;
            if (!dest)
                dest = {};

            for (var member in src) {
                if (src.hasOwnProperty(member)) {
                    dest[member] = src[member];
                }
            }

            return dest;
        },
        isArray: function (arr) {
            if (Array.isArray)
                return Array.isArray(arr);
            return Object.prototype.toString.call(arr) === '[object Array]';
        },
        getValue: function (obj, point) {
            var names = point.split('.');
            var val = obj;
            utils.each(names, function (name) {
                val = val[name];
                if (!val)
                    return false;
            });

            return val;
        },
        async: {
            parallel: function (tasks, callback, ctx) {
                var len = tasks.length;
                var count = 0;
                var results = [];

                utils.each(tasks, function (task) {
                    return task.call(ctx || this, function (err, result) {
                        count++;
                        results.push(result);

                        if (err || count === len) {
                            callback.call(ctx || this, err, results);
                        }
                    });
                });
            },
            /**
             * Interates on each item in array and processes it.
             * @param {Array} items The items.
             * @param {Function} fn The callback that is called for each item.
             * @param {Function} complete The callback that is called after all items are visited.
             * @param {Object} ctx The context that is passed to callbacks.
             */
            each: function (items, fn, complete, ctx) {
                var len = items.length;
                var count = 0;
                var stop = false;
                var results = [];
                var next = function (result) {
                    results.push(result);
                    count++;
                    if (count === len)
                        complete.call(ctx || this, results);
                };
                var finish = function (err) {
                    stop = true;
                    var args = err || results;
                    complete.call(ctx || this, args);
                };

                if (items.length === 0)
                    finish();
                else {
                    utils.each(items, function (item, i) {
                        if (!stop)
                            fn.call(ctx || this, item, i, next, finish);
                        else
                            return false;
                    });
                }
            }
        },
        dom: {
            getText: function (el) {
                if (el.textContent)
                    return el.textContent;
                else if (el.innerText)
                    return el.innerText;
                else
                    return el.nodeValue;
            },
            parseXML: function (xml) {
                if (typeof window !== "undefined") {
                    var $ = services.get('jquery', false) || window.$;
                    if ($)
                        return $.parseXML(xml);
                }

                var DOMParser = services.get('domparser', false);
                if (DOMParser)
                    return new DOMParser().parseFromString(xml);

                throw new Error("parseXML() doesn't support in this enviroment.");
            }
        },
        path: {
            removeEndSeparator: function (path) {
                var _vp = utils.trimEnd(path);
                var sp = "/\\";
                var idx = _vp.length - 1;
                while (idx > -1 && sp.indexOf(_vp.charAt(idx)) !== -1) {
                    idx--;
                }
                idx++;
                return _vp.substring(0, idx);
            },
            getParent: function (path) {
                var separators = "/\\";
                var index = -1;
                for (var i = path.length - 1; i >= 0; i--) {
                    if (separators.indexOf(path.charAt(i)) !== -1) {
                        index = i;
                        break;
                    }
                }

                path = path.substring(0, index);
                this.removeEndSeparator(path);

                return path;
            },
            removeStartSeparator: function (path) {
                path = utils.trimStart(path);
                var sp = "/\\";
                var idx = 0;
                var len = path.length;
                while (idx < len && sp.indexOf(path.charAt(idx)) !== -1) {
                    idx++;
                }
                return path.substring(idx);
            },
            combine: function (path1, path2) {
                var paths = [];
                var vp1 = this.removeEndSeparator(path1);
                var vp2 = this.removeStartSeparator(path2);
                paths.push(vp1);
                paths.push(vp2);

                if (arguments.length > 2) {
                    for (var i = 2, len = arguments.length; i < len; i++) {
                        var vp = this.removeStartSeparator(arguments[i]);
                        paths.push(vp);
                    }
                }

                return paths.join('/');
            }
        }
    };

    var _services = {};
    var services = (function () {
        return {
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
    })();

    var logger = {
        warning: function (msg, args) {
            var s = utils.format(msg, args);
            console.log('Warning: ' + s);
        },
        error: function (msg, args) {
            var s = utils.format(msg, args);
            return new Error(s);
        }
    };

    //XmlObject
    var XmlNodeType = {
        Element: "Element",
        EndElement: "EndElement"
    };

    /**
     * An object allows visiting elements on XML document.
     * @param {Element} xnode
     */
    function XmlObject(xnode) {
        if (xnode.nodeType === 9)
            xnode = this.children(xnode)[0];
        /**@type Element*/
        this.xnode = xnode;
        /**@type XmlNodeType*/
        this.nodeType = null;
        /**@type Boolean*/
        this.isEOF = false;
        /**@type Element[]*/
        this._parents = [null];
        /**@type Element[]*/
        this._stack = [xnode];
        /**@type Element*/
        this.current = null;
    }
    XmlObject.prototype = {
        /**
         * Returns children of current node.
         * @param {Element} xnode The current node.
         */
        children: function (xnode) {
            if (xnode.children)
                return xnode.children;
            return utils.filter(xnode.childNodes, function (child) {
                return child.nodeType === 1;
            });
        },
        /**
         * Start visiting on the element.
         * @param {Element} item The element is going to begin visiting on.
         */
        start: function (item) {
            this.current = item;
            this.nodeType = XmlNodeType.Element;
            this.localName = item.localName;

            var parent = item;
            this._parents.push(parent);
            this._stack.push(parent);

            var childs = this.children(item);
            var len = childs.length;
            this.isEmptyElement = (len === 0);
            for (var i = len - 1; i >= 0; i--) {
                this._stack.push(childs[i]);
                this._parents.push(parent);
            }
        },
        /**
         * Stop visiting on the element.
         * @param {Element} item The element is going to finish visiting on.
         */
        end: function (item) {
            this.current = item;
            this.nodeType = XmlNodeType.EndElement;
            this.localName = item.localName;
            this.isEOF = this._stack.length === 0;
        },
        /**
         * Moves to next element.
         * @returns {Boolean} Returns false if we have no element to be visited anymore, otherwise returns true.
         */
        next: function () {
            if (this.isEOF)
                return false;

            var parent = this._parents.pop();
            var item = this._stack.pop();
            if (item !== parent) {
                this.start(item);
            } else {
                this.end(parent);
            }

            return true;
        },
        /**
         * Moves to next element.
         * @param {Function} fn The callback to handle whenever we reache an element.
         * @returns {Boolean} Returns false if we have no element to be visited anymore, otherwise returns true.
         */
        read: function (fn) {
            var result = this.next();
            if (fn)
                fn.call(this, this.current, this.nodeType, this.isEOF);
            return result;
        },
        /**
         * Moves current position to the specified element.
         * @param {String} name The element name need moving to.
         */
        moveTo: function (name) {
            while (this.read()) {
                switch (this.nodeType) {
                    case XmlNodeType.Element:
                        if (this.localName === name)
                            return true;
                        break;
                }
            }

            return false;
        },
        /**
         * Represents a xml document in string.
         */
        toString: function () {
            var xml = "";
            while (this.read()) {
                switch (this.nodeType) {
                    case XmlNodeType.Element:
                        var item = this.current;
                        xml += '<' + item.localName;
                        var attrs = [];
                        utils.each(item.attributes, function (attr) {
                            attrs.push(attr.nodeName + '="' + attr.nodeValue + '"');
                        });
                        if (attrs.length > 0)
                            xml += ' ' + attrs.join(' ');
                        xml += '>';
                        break;
                    case XmlNodeType.EndElement:
                        xml += '</' + item.localName + '>';
                        break;
                }
            }
            return xml;
        }
    };
    //////////////////////////////////////////////////////

    //Properties
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
    /////////////////////////////////////////////////////

    //Conditions
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
    /////////////////////////////////////////////////////

    var bus = (function () {
        var events = {};

        return {
            on: function (name, fn, ctx, once) {
                var names = name.split(' ');
                for (var i = 0; i < names.length; i++) {
                    var _name = names[i];
                    var handlers = events[_name];
                    if (!handlers) {
                        handlers = [];
                        events[_name] = handlers;
                    }

                    handlers.push({once: (once === true), fn: fn, ctx: ctx});
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
    })();

    var topologicalSort = (function () {
        function Node(codon) {
            var visited = false;
            var previous = [];

            this.visit = function (codonOutputs) {
                if (!visited)
                    return;
                visited = true;
                for (var i = 0; i < previous.length; i++) {
                    previous[i].visit(codonOutputs);
                }

                codonOutputs.push(codon);
            };
        }

        return {
            sort: function (codonInputs) {//Array of Codons.
                // Step 1: create nodes for graph
                var nameToNodeDict = {};
                var allNodes = [];

                // create entries to preserve order within
                var previous = null;
                utils.each(codonInputs, function (codon) {
                    var node = new Node(codon);
                    var id = codon.id;
                    if (!utils.isNullOrEmpty(id))
                        nameToNodeDict[id] = node;

                    //add implicit edges
                    if (previous)
                        node.previous.push(previous);

                    allNodes.push(node);
                    previous = node;
                });

                // Step 2: create edges from insertBefore/insertAfter values
                utils.each(allNodes, function (node) {
                    if (!utils.isNullOrEmpty(node.codon.insertBefore)) {
                        utils.each(node.codon.insertBefore.split(','), function (beforeReference) {
                            var referencedNode = nameToNodeDict[beforeReference];
                            if (referencedNode)
                                referencedNode.previous.push(node);
                            else
                                logger.warning("Codon ({0}) specified in the insertbefore of the {1} codon does not exist!", beforeReference, node.codon);
                        });
                    }

                    if (!utils.isNullOrEmpty(node.codon.insertAfter)) {
                        utils.each(node.codon.insertAfter.split(','), function (afterReference) {
                            var referencedNode = nameToNodeDict[afterReference];
                            if (referencedNode)
                                node.previous.push(referencedNode);
                            else
                                logger.warning("Codon ({0}) specified in the insertafter of the {1} codon does not exist!", afterReference, node.codon);
                        });
                    }
                });

                // Step 3: Perform Topological Sort
                var outputs = [];//Array of Codon objects.
                utils.each(allNodes, function (node) {
                    node.visit(outputs);
                });

                return outputs;
            }
        };
    })();

    /**
     * The class that allow to load and instantiate Doozer class on-demand(lazy loading).
     * @param {String} name
     * @param {String} point
     * @param {Runtime} runtime
     */
    function LazyLoadDoozer(runtime, name, point) {
        this.name = name;
        this.point = point;
        this.runtime = runtime;
        this.handleCondition = false;
    }
    LazyLoadDoozer.prototype = {
        buildItem: function (args, done) {
            var name = this.name;
            var handleCondition = this.handleCondition;
            var point = this.point;
            var runtime = this.runtime;

            runtime.ready(function (instance) {
                var doozer = utils.getValue(instance, point);
                if (!doozer)
                    throw logger.error("Loading Doozer failed. Cannot load doozer " + name + " from the " + runtime.name + " runtime.");

                doozer.handleCondition = handleCondition;
                doozers.set(name, doozer);
                doozer.buildItem(args, done);
            });
        }
    };

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

    function Runtime(addIn, props, isReference) {
        this.addIn = addIn;
        this.props = props;
        this.name = props.get('name');
        this.moduleInstance = null;
        this.isReference = isReference;
    }
    Runtime.prototype = {
        /**
         * Imports doozers & evaluators from xml reader.
         * @param {XmlObject} reader
         * @param {String} endElement
         */
        read: function (reader, endElement) {
            while (reader.read()) {
                switch (reader.nodeType) {
                    case XmlNodeType.Element:
                        if (reader.localName === "Doozer" || reader.localName === "ConditionEvaluator") {
                            var props = Properties.read(reader);
                            var name = props.get("name");
                            var point = props.get("point");

                            if (reader.localName === "Doozer") {
                                var doozer = new LazyLoadDoozer(this, name, point);
                                doozers.set(name, doozer);
                            } else {
                                var evaluator = new LazyLoadEvaluator(this, name, point);
                                evaluators.set(name, evaluator);
                            }
                        }
                        break;
                    case XmlNodeType.EndElement:
                        if (reader.localName === endElement)
                            return;
                        break;
                }
            }
        },
        ready: function (cb) {
            if (!this.moduleInstance) {
                var _this = this;
                if (!this.isReference) {
                    var modulePath = this.props.get('path');
                    var url = utils.path.combine(this.addIn.props.get('baseUrl'), modulePath);
                    var require = services.get('requirejs');

                    require([url], function (fn) {
                        var instance = fn(_this.addIn.sandbox);
                        _this.moduleInstance = instance;
                        cb(instance);
                        _this = null;
                    });
                } else {
                    var from = this.props.get('from');
                    if (utils.isNullOrEmpty(from))
                        throw logger.error("RuntimeReference Exception: The Reference node was not found the from attribute.");

                    var addInRef = utils.filter(addins, function (addin) {
                        return addin.props.get('name') === from;
                    })[0];
                    if (!addInRef)
                        throw logger.error("RuntimeReference Exception: The addin reference '{0}' doesn't exist.", from);
                    var runtime = addInRef.runtimes[this.name];
                    if (!runtime)
                        throw logger.error("RuntimeReference Exception: The {0} runtime doesn't exist in the {1} addin.", this.name, from);

                    runtime.ready(function (instance) {
                        _this.moduleInstance = instance;
                        _this = null;
                        cb(instance);
                    });
                }
            } else
                cb(this.moduleInstance);
        }
    };

    ///////////////////////////////////////
    var runtimes = {
        get: function (name, addin) {
            var found = (addin) ? addin.runtimes[name] : null;
            if (!found) {
                utils.each(addins, function (_addin) {
                    if (_addin !== addin) {
                        found = _addin.runtimes[name];
                        if (found)
                            return false;
                    }
                });
            }

            return found;
        },
        /**
         * Load runtimes from xml reader.
         * @param {XmlObject} reader
         * @param {String} endElement
         * @param {AddIn} addIn The addin package.
         */
        read: function (reader, endElement, addIn) {
            var _runtimes = {};
            while (reader.read()) {
                var lcname = reader.localName;
                switch (reader.nodeType) {
                    case XmlNodeType.Element:
                        if (lcname === "Import" || lcname === "Reference") {
                            var props = Properties.read(reader);
                            var runtime = new Runtime(addIn, props, lcname === "Reference");
                            var name = props.get('name');
                            _runtimes[name] = runtime;
                            runtime.read(reader, lcname);
                        }
                        break;
                    case XmlNodeType.EndElement:
                        if (reader.localName === endElement)
                            return _runtimes;
                        break;
                }
            }

            return _runtimes;
        }
    };

    var _doozers = {};
    /**
     * A collection of Doozer objects.
     */
    var doozers = (function () {
        return {
            lazyload: function (name, callback) {
                var lzDoozer = new LazyLoadDoozer(name, callback);
                this.set(name, lzDoozer);
                return lzDoozer;
            },
            set: function (name, doozer) {
                var names = name.split(',');
                utils.each(names, function (_name) {
                    _doozers[_name] = doozer;
                });

            },
            get: function (name) {
                return _doozers[name];
            }
        };
    })();

    /**
     * A collection of Condition Evaluator objects.
     * */
    var evaluators = (function () {
        var _evaluators = {};

        return {
            lazyload: function (name, callback) {
                var lzEvaluator = new LazyLoadEvaluator(name, callback);
                this.set(name, lzEvaluator);
                return lzEvaluator;
            },
            set: function (name, evaluator) {
                _evaluators[name] = evaluator;
            },
            get: function (name) {
                return _evaluators[name];
            }
        };
    })();

    function AddIn(sandbox, props) {
        this.sandbox = sandbox;
        this.props = props;
        this.name = props.name;
    }

    /**
     * Loads components that are defined in this addin package.
     * @param {XmlObject} reader The xml reader.
     */
    AddIn.prototype.read = function (reader) {
        while (reader.read()) {
            switch (reader.nodeType) {
                case XmlNodeType.Element:
                    if (reader.localName === "Runtime") {
                        var runtimes = this.sandbox.runtimes.read(reader, "Runtime", this);
                        this.runtimes = runtimes;
                    } else if (reader.localName === "Extension") {
                        var _props = Properties.read(reader);
                        var path = _props.get('name');
                        var node = Node.get(path, true);
                        node.read(reader, "Extension", this);
                    }
                    break;
            }
        }
    };

    /**
     * @param {{parameter: Object, codon: Codon, conditions: Condition[], subItemNode: Node}} args
     */
    function BuildItemArgs(args) {
        if (!args)
            args = {};
        var codon = args.codon;
        if (!codon)
            throw logger.error("BuildItemArgs Exception: The codon parameter is null.");
        this.parameter = args.parameter;
        this.codon = codon;
        this.conditions = args.conditions;
        /**@type {Node}*/
        this.subItemNode = args.subItemNode;
    }
    BuildItemArgs.prototype = {
        buildSubItems: function (args, callback) {
            if (arguments.length === 1) {
                callback = args;
                args = {};
            } else
                args = args || {};

            if (!this.subItemNode)
                callback([]);
            else {
                if (!args.parameter)
                    args.parameter = this.parameter;
                if (!this.conditions)
                    args.conditions = this.conditions;

                this.subItemNode.buildItems(args, callback);
            }
        }
    };
    BuildItemArgs.create = function (parameter, codon, conditions, subItemNode) {
        return new BuildItemArgs(parameter, codon, conditions, subItemNode);
    };

    /**
     * Represents a node in the add in tree that can produce an item.
     * @param {AddIn} addIn The addin that contains this codon.
     * @param {String} name Type of codon, e.g: MenuItem, TabItem, etc...
     * @param {Properties} props The properties of codon, e.g: {id = 'openFile', label='Open File', ...}
     * @param {Condition[]} conditions List of condition applied for this codon.
     */
    function Codon(addIn, name, props, conditions) {
        this.name = name;
        this.props = props || {};
        this.conditions = conditions;
        this.addIn = addIn;
        this.content = null;
        this.id = props.get('id');
    }
    Codon.prototype = {
        buildItem: function (args, callback) {
            if (arguments.length === 1) {
                callback = args;
                args = {};
            } else if (!args)
                args = {};

            args.codon = this;

            var doozer = doozers.get(this.name);
            if (!doozer) {
                throw logger.error("Doozer " + this.name + " not found! " + this.toString());
            }

            if (!doozer.handleConditions) {
                Condition.getFailedAction({parameter: args.parameter, conditions: args.conditions}, function (action) {
                    if (action !== ConditionFailedAction.Nothing)
                        callback(null);
                    else
                        doNext();
                });
            } else
                doNext();

            function doNext() {
                if (!(args instanceof BuildItemArgs))
                    args = new BuildItemArgs(args);
                doozer.buildItem(args, callback);
            }
        },
        get: function (name, defaultValue) {
            return this.props.get(name, defaultValue);
        },
        toString: function () {
            return utils.format("[Codon: name = {0}, id = {1}]",
                    this.name,
                    this.id);
        }
    };

    /**
     * A node that contains codons.
     * @param {String} name The node name.
     * @param {Node} parent The parent node.
     */
    function Node(name, parent) {
        this.name = name;
        this.parent = parent;
        /**@type {Codon[]}*/
        this.codons = [];
        /**@type {Object.<string,Node>}*/
        this.childs = {};
    }
    Node.prototype = {
        /**
         * Add codons into the node.
         * @param {Codon[]} codonList A list of codon need to be added.
         */
        addCodons: function (codonList) {
            utils.each(codonList, function (codon) {
                this.codons.push(codon);
            }, this);
        },
        /**
         * Returns the node from specified path.
         * @param {String} path The path of relative node. E.g: /safe.cash/web/home/header/actions
         * @param {Boolean} createNew If createNew is true or undefined, we will create the node if it doesn't exist.
         */
        get: function (path, createNew) {
            var names = path.split('/');
            var cur = this;
            for (var i = 0; i < names.length; i++) {
                var name = names[i];
                var _cur = cur.childs[name];
                if (!_cur) {
                    if (utils.isNullOrUndefined(createNew) || createNew === true) {
                        var node = new Node(name, cur);
                        cur.childs[name] = node;
                        cur = node;
                    } else
                        return null;
                } else
                    cur = _cur;
            }

            return cur;
        },
        /**
         * Builds the child items in this path.
         * @param {{name:String, parameter:Object, conditions: Condition[]}} args Other settings.
         * @param {Function} callback The function to handle after building finish.
         */
        buildItems: function (args, callback) {
            if (arguments.length < 2) {
                callback = args || function () {};
                args = {};
            } else
                args = args || {};

            var codons = this.codons;
            var items = [];
            var name = args.name;
            var codonList = (utils.isNullOrUndefined(name)) ? codons : utils.filter(codons, function (codon) {
                return codon.name === name;
            });

            utils.async.each(codonList, function (codon, i, next) {
                var _args = {codon: codon, parameter: args.parameter, conditions: args.conditions};
                this.buildItem(_args, function (item, multipleItems) {
                    if (item) {
                        if (multipleItems)
                            utils.each(item, function (_item) {
                                items.push(_item);
                            });
                        else
                            items.push(item);
                    }

                    next();
                });
            }, function () {
                callback(items);
            }, this);
        },
        /**
         * Builds a real object from codon.
         * @param {{codon: codon, parameter: Object, conditions: Condition[], callback: Function}} args Other settings.
         * @param {Function} callback The function to handle after building finish.
         */
        buildItem: function (args, callback) {
            if (arguments.length < 2) {
                callback = args || function () {};
                args = {};
            } else if (!args)
                args = {};

            var codon = args.codon || this.codons[0];//The Codon instance, e.g: MenuItem, ToolbarItem, etc...
            if (!codon)
                throw logger.error("There is no codon in the [{0}] node", this.getFullPath());
            var id = codon.id;
            var subItemNode = this.childs[id];
            var conditions;
            if (!args.conditions)
                conditions = codon.conditions;
            else if (!codon.conditions)
                conditions = args.conditions;
            else
                conditions = utils.concat(codon.conditions, args.conditions);
            args.conditions = conditions;
            args.subItemNode = subItemNode;

            codon.buildItem(args, callback);
        },
        /**
         * Loads codons from xml reader.
         * @param {XmlObject} reader
         * @param {String} endElement
         * @param {AddIn} addIn
         */
        read: function (reader, endElement, addIn) {
            /**@type {Condition[]}*/
            var conditionStack = [];

            while (reader.read()) {
                switch (reader.nodeType) {
                    case XmlNodeType.EndElement:
                        if (reader.localName === "Condition" || reader.localName === "ComplexCondition") {
                            conditionStack.pop();
                        } else if (reader.localName === endElement) {
                            return;
                        }
                        break;
                    case XmlNodeType.Element:
                        var elementName = reader.localName;
                        if (elementName === "Condition") {
                            conditionStack.push(Condition.read(reader, addIn));
                        } else if (elementName === "ComplexCondition") {
                            conditionStack.push(Condition.readComplexCondition(reader, addIn));
                        } else {
                            var newCodon = new Codon(addIn, elementName, Properties.read(reader), utils.copy([], conditionStack));
                            this.codons.push(newCodon);

                            if (!this.childs._count)
                                this.childs._count = 1;
                            else
                                this.childs._count += 1;

                            var id = newCodon.id;
                            if (!id) {
                                id = "node_" + this.childs._count;
                                newCodon.id = id;
                            }
                            var subNode = this.get(id);

                            if (!reader.isEmptyElement) {
                                subNode.read(reader, elementName, addIn);
                            } else {
                                newCodon.content = utils.dom.getText(reader.current);
                                reader.read();//Move to end of element.
                            }
                        }
                        break;
                }
            }
        },
        /**
         * Gets full path of current node. e.g: /safe.cash/web/home.
         */
        getFullPath: function () {
            var stack = [this.name];
            var parent = this.parent;
            while (parent) {
                stack.push(parent.name);
                parent = parent.parent;
            }
            var queue = [];
            while (stack.length)
                queue.push(stack.pop());
            return queue.join('/');
        },
        toString: function () {
            return utils.format("[{0}]", this.getFullPath());
        }
    };

    /**
     * Represents root node(with name is empty). Sub-nodes that derives from root node must begin by a slash character('/').
     * E.g: /safe.cash/web/header/actions.
     */
    Node.root = new Node('');

    /**
     * Gets the node of the specified path.
     * @param {String} path
     * @param {Boolean} createNew Indicates whether the node will be created if it doesn't exist.
     * @returns {Node} returns the node that points to the specified path.*/
    Node.get = function (path, createNew) {
        if (path[0] !== '/')
            throw logger.error("The path must begin by a slash character('/').");

        return Node.root.get(path.substr(1), createNew);
    };

    /**
     * Builds nodes and load codons from xml reader.
     * @param {XmlObject} reader The xml reader.
     * @param {AddIn} addIn The addin package.
     */
    Node.read = function (reader, addIn) {
        while (reader.read()) {
            switch (reader.nodeType) {
                case XmlNodeType.Element:
                    if (reader.localName === "Extension") {
                        var props = Properties.read(reader);
                        var path = props.get('name');
                        var node = Node.get(path, true);
                        node.read(reader, "Extension", addIn);
                    }
                    break;
            }
        }
    };

    /**
     * The Sandbox class, it ensures a consistant interface.
     * It is a bridge between modules and the back-end layer.
     * A module knows its Sandbox instance only.
     * @param {App} app
     */
    function Sandbox(app) {
        this.core = {
            utils: utils,
            logger: logger
        };

        this.bus = bus;
        this.doozers = doozers;
        this.evaluators = evaluators;
        this.services = services;
        this.runtimes = runtimes;
        this.baseUrl = app.baseUrl;
    }

    Sandbox.prototype = {
        /**
         * Loads components from XML element.
         * @param {Element} xmlElement
         */
        read: function (xmlElement) {
            var reader = new XmlObject(xmlElement);
            Node.read(reader);
        },
        /**
         * Gets a node from the sepcified path
         * @param {String} path The path to find.
         */
        get: function (path) {
            return Node.get(path, false);
        },
        /**
         * Gets addin with the specified name.
         * @param {String} name The addin name.
         */
        getAddIn: function (name) {
            return utils.filter(addins, function (addin) {
                return addin.props.get('name') === name;
            })[0];
        },
        /**
         * Gets runtime with specified name.
         * @param {String} name The runtime name.
         * @param {AddIn} addin The addin that contains this runtime object. If pass null, it will try to get from all addins.
         */
        getRuntime: function (name, addin) {
            return runtimes.get(name, addin);
        }
    };

    var addins = [];
    var app = (function () {
        return {
            bus: bus,
            services: services,
            runtimes: runtimes,
            utils: utils,
            baseUrl: '',
            start: function (addinConfigs, addinsFolder) {
                var gl = this.services.get('window', false);
                if (!gl) {
                    if (typeof window !== "undefined")
                        gl = window;
                }
                var $ = services.get('jquery', false) || gl.$;
                if (!$)
                    throw logger.error("jQuery is not registered.");
                var require = services.get('requirejs', false) || gl.require;
                if (!require)
                    throw logger.error("requirejs is not registered.");

                addinsFolder = addinsFolder || "addins";

                addinConfigs = utils.filter(addinConfigs, function (config) {
                    return config.disabled !== true;
                });
                var addinFiles = [];

                utils.each(addinConfigs, function (addinConfig) {
                    var path = (addinConfig.absolute !== true) ? utils.path.combine(addinsFolder, addinConfig.path) : addinConfig.path;
                    var baseUrl = utils.path.getParent(path);
                    addinConfig.baseUrl = baseUrl;
                    var addinFile = "text!" + path;
                    addinFiles.push(addinFile);
                });

                require(addinFiles, function () {
                    utils.each(arguments, function (data, idx) {
                        var xml = utils.dom.parseXML(data);
                        var reader = new XmlObject(xml);
                        if (reader.moveTo("AddIn")) {
                            var props = Properties.read(reader);
                            var baseUrl = addinConfigs[idx].baseUrl;
                            props.set('baseUrl', baseUrl);
                            var addin = new AddIn(new Sandbox(app), props);
                            addin.read(reader);
                            addins.push(addin);
                        }
                    });

                    var node = Node.get('/autostart', false);
                    if (node) {
                        node.buildItems(function (commands) {
                            utils.each(commands, function (cmd) {
                                try {
                                    cmd.execute();
                                } catch (ex) {
                                    logger.warning("Execute command at autostart: " + ex.message);
                                }
                            });
                        });
                    }
                });
            }
        };
    })();

    return app;

    /*
     var app = (function () {
     var modules = {};
     
     return {
     bus: bus,
     register: function (moduleId, creator) {
     modules[moduleId] = {
     creator: creator,
     instance: null
     };
     },
     start: function (moduleId) {
     var moduleItem = modules[moduleId];
     var instance = moduleItem.creator(new Sandbox(this));
     moduleItem.instance = instance;
     if (instance.init)
     instance.init();
     },
     stop: function (moduleId) {
     var moduleItem = modules[moduleId];
     if (moduleItem.instance) {
     var instance = moduleItem.instance;
     moduleItem.instance = null;
     instance.destroy();
     }
     },
     startAll: function () {
     for (var moduleId in modules) {
     if (modules.hasOwnProperty(moduleId))
     this.start(moduleId);
     }
     },
     stopAll: function () {
     for (var moduleId in modules) {
     if (modules.hasOwnProperty(moduleId))
     this.stop(moduleId);
     }
     }
     };
     })();
     */
});