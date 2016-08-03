(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['simple-diff'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('simple-diff'));
    } else {
        root.SimpleStore = factory(root.simpleDiff);
    }
}(this, function (diff) {

    function SimpleStore(state, options) {
        this.state = state;
        this.options = options || {};
        this.events = {};
    }

    SimpleStore.prototype.set = function (path, newState) {
        if (arguments.length === 1) {
            newState = path;
            path = [];
        }

        if (isString(path)) {
            path = stringToPath(path);
        }

        var oldState = this.state,
            curState = this.state;

        for (var i = 0, len = path.length, prop; i < len; i++) {
            prop = path[i];

            if (i + 1 === len) {
                oldState = curState[prop];
                curState[prop] = newState;
            }
            else {
                curState = curState[prop];
            }
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

    SimpleStore.prototype.get = function (path) {
        if (isString(path)) {
            path = stringToPath(path);
        }

        var curState = this.state;

        for (var i = 0, len = path.length, prop; i < len; i++) {
            prop = path[i];

            curState = curState[prop];
        }

        return curState;
    };

    SimpleStore.prototype.on = function (event, path, callback) {
        if (typeof path === 'function') {
            callback = path;
            path = '**';
        }

        if (typeof path === 'object') {
            path = pathToString(path);
        }

        if (!this.events[event]) {
            this.events[event] = {};
        }

        if (!this.events[event][path]) {
            this.events[event][path] = [];
        }

        this.events[event][path].push(callback);

        return this;
    };

    SimpleStore.prototype.off = function (event, path, callback) {
        if (arguments.length === 0) {
            this.events = {};
            return this;
        }

        if (typeof path === 'object') {
            path = pathToString(path);
        }

        if (typeof path === 'function') {
            callback = path;
            path = '**';
        }

        if (this.events[event]) {
            if (typeof path === 'undefined') {
                delete this.events[event];
            }
            else if (this.events[event][path]) {
                if (callback) {
                    var index;
                    while ((index = this.events[event][path].indexOf(callback)) > -1) {
                        this.events[event][path].splice(index, 1);
                    }
                }
                else {
                    delete this.events[event][path];
                }
            }
        }

        return this;
    };

    SimpleStore.prototype.trigger = function (event, path, data) {
        if (typeof event === 'object') {
            data = event;
            event = data.type;
            path = data.newPath;
        }

        if (typeof path === 'object') {
            path = pathToString(path);
        }

        var events = this.events[event];

        if (events) {
            var store = this;

            if (events[path]) {
                events[path].forEach(function (callback) {
                    callback.call(store, data);
                });
            }

            if (path !== '**' && events['**']) {
                events['**'].forEach(function (callback) {
                    callback.call(store, data);
                });
            }
        }

        return this;
    };

    SimpleStore.prototype.addItem = function (path, item, index) {
        if (isString(path)) {
            path = stringToPath(path);
        }

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

    SimpleStore.prototype.removeItem = function (path, index) {
        if (isString(path)) {
            path = stringToPath(path);
        }

        var newArray = [].concat(this.get(path));

        if (typeof index === 'object') {
            index = findIndex(newArray, index);
        }

        newArray.splice(index, 1);

        this.set(path, newArray);

        return this;
    };

    SimpleStore.prototype.moveItem = function (path, from, to) {
        if (isString(path)) {
            path = stringToPath(path);
        }

        var array = this.get(path);

        if (typeof from === 'object') {
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

    return SimpleStore;

    function isString(value) {
        return typeof value === 'string';
    }

    function pathToString(path) {
        return path.map(numberToAsterisk).join('.');
    }

    function stringToPath(path) {
        return path ? path.split('.') : [];
    }

    function numberToAsterisk(value) {
        return typeof value === 'number' ? '*' : value;
    }

    function extend(target) {
        for (var i = 1, len = arguments.length; i < len; i++) {
            var source = arguments[i];
            for (var prop in source) {
                if (!source.hasOwnProperty(prop)) continue;

                target[prop] = source[prop];
            }
        }

        return target;
    }

    function findIndex(array, props) {
        var index = array.indexOf(props);

        if (index > -1) return index;

        next: for (var i = 0, len = array.length, item; i < len; i++) {
            item = array[i];

            for (var prop in props) {
                if (!props.hasOwnProperty(prop)) continue;

                if (item[prop] !== props[prop]) continue next;
            }

            return i;
        }

        return -1;
    }

}));