var WHITE_SPACE = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';

module.exports = {
    trim: function (s) {
        s = this.trimStart(s);
        s = this.trimEnd(s);
        return s;
    },
    trimEnd: function (s) {
        var whitespace = WHITE_SPACE;
        for (var i = s.length - 1; i >= 0; i--) {
            if (whitespace.indexOf(s.charAt(i)) === -1) {
                return s.substring(0, i + 1);
            }
        }

        return s;
    },
    trimStart: function (s) {
        var whitespace = WHITE_SPACE;
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
        if (this.isNullOrUndefined(items))
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
        if (this.isNullOrUndefined(items))
            return results;

        this.each(items, function (item, i) {
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
        this.each(names, function (name) {
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

            this.each(tasks, function (task) {
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
                this.each(items, function (item, i) {
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
        }/*,
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
        }*/
    },
    path: {
        removeEndSeparator: function (path) {
            var _vp = this.trimEnd(path);
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
            path = this.trimStart(path);
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