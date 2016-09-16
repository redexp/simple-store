(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['simple-diff'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('simple-diff'));
    } else {
        root.SimpleStore = factory(root.simpleDiff);
    }
}(this, function (diff) {

    function Store(state, options) {
        this.state = state || {};
        this.options = options || {};
        this.events = {};
    }

    Store.prototype.set = function (path, newState) {
        if (arguments.length === 1) {
            newState = path;
            path = [];
        }

        path = absolutePath(this.state, ensurePath(path));

        var parent = this.get(path.slice(0, path.length - 1)),
            oldState = this.get(path);

        if (path.length === 0) {
            oldState = this.state;
            this.state = newState;
        }
        else {
            var last = path[path.length - 1];
            parent = this.get(path.slice(0, path.length - 1));
            oldState = parent[last];
            parent[last] = newState;
        }

        var store = this;

        diff(oldState, newState, extend({}, this.options, {
            oldPath: path,
            newPath: path,
            callback: function (e) {
                store.trigger(e);
            }
        }));

        return this;
    };

    Store.prototype.get = function (path, index) {
        path = ensurePath(path);

        if (arguments.length === 1) {
            index = path.length - 1;
        }

        var curState = this.state;

        for (var i = 0, prop; i <= index; i++) {
            prop = path[i];

            if (isObject(prop)) {
                prop = findIndex(curState, prop);
            }

            if (!has(curState, prop)) return;

            curState = curState[prop];
        }

        return curState;
    };

    Store.prototype.remove = function (path) {
        path = ensurePath(path);

        var parent = path.slice(0, path.length - 1),
            prop = path[path.length - 1];

        var state = extend({}, this.get(parent));
        delete state[prop];
        this.set(parent, state);
    };
    
    var EVENTS = '__events__',
        RULES = '__rules__';

    Store.prototype.on = function (events, path, callback) {
        events = events.split(/\s+/);

        path = ensurePath(path);

        for (var i = 0, len = events.length, event; i < len; i++) {
            event = events[i];

            var ev = this.events;

            if (!ev[event]) {
                ev[event] = {};
            }

            ev = ev[event];

            for (var j = 0, n = path.length, item; j < n; j++) {
                item = path[j];

                if (isObject(item)) {
                    var rules = ev[RULES];
                    
                    if (!rules) {
                        ev[RULES] = rules = [];
                    }
                    
                    var ruleIndex = findRuleIndex(rules, item);
                    
                    if (ruleIndex > -1) {
                        ev = rules[ruleIndex][1];
                    }
                    else {
                        rules.push([item, ev = {}]);
                    }
                    
                    continue;
                }

                if (!ev[item]) {
                    ev[item] = {};
                }

                ev = ev[item];
            }

            if (!ev[EVENTS]) {
                ev[EVENTS] = [];
            }

            ev[EVENTS].push(callback);
        }

        return this;
    };

    Store.prototype.off = function (events, path, callback) {
        if (arguments.length === 0) {
            this.events = {};
            return this;
        }

        var event;

        if (isObject(events)) {
            for (event in this.events) {
                this.off(event, events, path);
            }
            return this;
        }

        events = events.split(/\s+/);

        if (typeof path !== 'undefined') {
            path = ensurePath(path);
        }

        events: for (var i = 0, len = events.length; i < len; i++) {
            event = events[i];

            var ev = this.events;

            if (!ev[event]) continue;

            if (!path) {
                ev[event] = {};
                continue;
            }

            ev = ev[event];

            for (var j = 0, n = path.length, item; j < n; j++) {
                item = path[j];
                
                if (isObject(item)) {
                    var rules = ev[RULES];
                    
                    if (!rules) continue events;
                    
                    var ruleIndex = findRuleIndex(rules, item);
                    
                    if (ruleIndex > -1) {
                        ev = rules[ruleIndex][1];
                    }
                    else {
                        continue events;
                    }
                }
                else {
                    if (!ev[item]) continue events;

                    ev = ev[item];
                }
            }

            if (!ev[EVENTS]) continue;

            if (callback) {
                removeItem(ev[EVENTS], callback);
            }
            else {
                ev[EVENTS] = [];
            }
        }

        return this;
    };

    Store.prototype.trigger = function (event, path) {
        var args;

        if (isObject(event)) {
            args = Array.prototype.slice.call(arguments);
            event = args[0].type;
            path = args[0].path || args[0].newPath;
        }
        else {
            args = Array.prototype.slice.call(arguments, 2);
        }

        if (!this.events[event]) return this;

        path = ensurePath(path);

        var store = this;

        trigger(this.events[event], path, 0);

        function trigger(events, path, index) {
            if (index === path.length && has(events, EVENTS)) {
                for (var i = 0, len = events[EVENTS].length, cb; i < len; i++) {
                    cb = events[EVENTS][i];
                    cb.apply(store, args);
                }
                return;
            }

            if (events[path[index]]) {
                trigger(events[path[index]], path, index + 1);
            }

            if (events['*']) {
                trigger(events['*'], path, index + 1);
            }

            var rules = events[RULES];
            
            if (rules) {
                var obj = store.get(path, index);

                if (!obj) return;

                for (var rI = 0, rLen = rules.length; rI < rLen; rI++) {
                    if (isEqual(obj, rules[rI][0])) {
                        trigger(rules[rI][1], path, index + 1);
                        break;
                    }
                }
            }
        }

        return this;
    };

    Store.prototype.getIdProp = function (path) {
        path = ensurePath(path);

        var ops = this.options;

        return (
            (ops.idProps &&
            (
                ops.idProps[path.map(numberToAsterisk).join('.')] ||
                ops.idProps[path.join('.')]
            )) || ops.idProp || 'id'
        );
    };

    Store.prototype.getItem = function (path, props) {
        var array = this.get(path),
            index = findIndex(array, props);

        return array[index];
    };

    Store.prototype.getIndex = function (path, props) {
        return findIndex(this.get(path), props);
    };

    Store.prototype.addItem = function (path, item, index) {
        path = ensurePath(path);

        var newArray = [].concat(this.get(path));

        if (arguments.length === 2) {
            newArray.push(item);
        }
        else {
            newArray.splice(index, 0, item);
        }

        this.set(path, newArray);

        return this;
    };

    Store.prototype.removeItem = function (path, index) {
        path = ensurePath(path);

        var newArray = [].concat(this.get(path));

        if (isObject(index)) {
            index = findIndex(newArray, index);
        }

        newArray.splice(index, 1);

        this.set(path, newArray);

        return this;
    };

    Store.prototype.moveItem = function (path, from, to) {
        path = ensurePath(path);

        var array = this.get(path);

        if (isObject(from)) {
            from = findIndex(array, from);

            if (from === -1) {
                throw new Error('Object not found in ' + path.join('.'));
            }
        }

        if (from >= array.length) {
            from = array.length - 1;
        }

        if (to >= array.length) {
            to = array.length - 1;
        }

        if (from === to) return this;

        var newArray = [].concat(array);

        var item = newArray[from];
        newArray.splice(from, 1);
        newArray.splice(to, 0, item);

        this.set(path, newArray);

        return this;
    };

    return Store;

    function isObject(value) {
        return !!value && typeof value === 'object';
    }

    function ensurePath(path) {
        return !path ? [] : typeof path === 'string' ? path.split('.') : path;
    }

    function absolutePath(state, path) {
        path = [].concat(path);

        for (var i = 0, len = path.length, prop; i <= len; i++) {
            prop = path[i];

            if (isObject(prop)) {
                path[i] = prop = findIndex(state, prop);
                continue;
            }

            if (!has(state, prop)) return path;

            state = state[prop];
        }

        return path;
    }

    function extend(target) {
        for (var i = 1, len = arguments.length; i < len; i++) {
            var source = arguments[i];
            for (var prop in source) {
                if (!has(source, prop)) continue;

                target[prop] = source[prop];
            }
        }

        return target;
    }

    function has(obj, prop) {
        return !!obj && obj.hasOwnProperty(prop);
    }

    function findIndex(array, props, fullEqual) {
        for (var i = 0, len = array.length, item; i < len; i++) {
            item = array[i];
            
            if (isEqual(item, props, fullEqual)) return i;
        }

        return -1;
    }
    
    function findRuleIndex(rules, props) {
        for (var i = 0, len = rules.length; i < len; i++) {
            if (isEqual(rules[i][0], props, true)) return i
        }
        
        return -1;
    }
    
    function isEqual(item, props, fullEqual) {
        if (item === props) return true;
        
        var prop;
        
        for (prop in props) {
            if (!has(props, prop)) continue;

            if (item[prop] !== props[prop]) return false;
        }

        if (fullEqual) {
            for (prop in item) {
                if (!has(item, prop)) continue;

                if (item[prop] !== props[prop]) return false;
            }
        }
        
        return true;
    }

    function removeItem(array, item) {
        var index;
        while ((index = array.indexOf(item)) > -1) {
            array.splice(index, 1);
        }
    }

    function numberToAsterisk(v) {
        return typeof v === 'number' ? '*' : v;
    }

}));