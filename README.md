simple-state-store
==================

Simple store with events

```javascript
var Store = require('simple-state-store');

var store = new Store({
    sidebar: {
        users: [
            {id: 1, name: 'user1'},
            {id: 2, name: 'user2'},
            {id: 3, name: 'user3'}
        ]
    },
    form: {
        user_id: null
    }
});

store.on('move-item', 'sidebar.users', function (e) {
    console.log('User moved from ' + e.curIndex + ' to ' + e.newIndex);
});

store.on('change', 'form.user_id', function (e) {
    console.log('Open form with user ' + store.getItem('sidebar.users', {id: e.newValue}).name);
});

store.moveItem('sidebar.users', {id: 3}, 0);

store.set('form.user_id', 2);
```
Output
```
User moved from 2 to 0
Open form with user user2
```

# Install

`npm i simple-state-store`

`bower i simple-state-store`

Lib will look for CommonJS or AMD or will be added global class called `SimpleStore`.

# Constructor

`new SimleStore(state, options)`

## Constructor options

Any option from [simple-diff](https://github.com/redexp/simple-diff)

# Properties

## `.state`

Holds current state of the store.

## `.options`

Holds options passed to constructor.

## `.events`

Holds events which structure is like
```
{
    [event]: {
        [path]: [
            callback,
            ...
        ]
    }
}
```

# Methods

## `.set([path,] data)`

When you call it with object it will look deeply into it and compare with old object in given path and will trigger event not once but for all changed deep properties.

 * `{String|Array} path` - path to property in store state. Can be as dots divided string like `prop1.prop2` or array `['prop1', 'prop2']`. If you want to change root state you can use or empty string or empty array or just skip this argument like `.set(newState)`
 * `{*} data` - new data for given path

## `.get(path)`

Returns data for given path. Instead of it you can get data just with `.state` property like `store.state.sidebar.users`

 * `{String|Array} path` - path to property in store state.

## `.on(event, [path,] callback)`

 * `{String} event` - name of event
 * `{String|Array} path` - path to property in store state. If you want handle events from all objects in array you can use asterisk instead of index `users.*.name`. If you want handle all events you can use `**` or just skip this argument.
 * `{Function} callback` - observer function
  
## `.off([event,] [path,] [callback])`

Regular off function to remove observers.

 * `.off(event)` - remove all observers of given event name
 * `.off(event, path)` - remove all observers of given event name in given path
 * `.off(event, path, callback)` - remove exac observer
 
## `.trigger(event, path, data)`

 * `{String|Object} event` - event name or event object like in [simple-diff](https://github.com/redexp/simple-diff). If event object given then all other arguments skipped, because it already has path and data as it self
 * `{String|Array} path` - path to property in store state.
 * `{*} data` - any data for observers
 
## `.getItem(path, props)`
 
Find object by given props in array by given path.
 
 * `{String|Array} path` - path to array.
 * `{Object} props` - criteria props to find object.
 
## `.getIndex(path, props)`

Find object index by given props in array by given path.
 
 * `{String|Array} path` - path to array.
 * `{Object} props` - criteria props to find object index.
 
## `.addItem(path, item, [index])`

Shortcut for `.push(item)` or `.splice(index, 0, item)`

 * `{String|Array} path` - path to array.
 * `{*} item` - any data for new array item.
 * `{Number} index` - index to insert item in array.
 
## `.removeItem(path, indexOrProps)`

Shortcut for `.splice(index, 1)`

 * `{String|Array} path` - path to array.
 * `{Number|Object} indexOrProps` - index or props to find item index.

## `.moveItem(path, indexOrProps, newIndex)`

Will change position of item in array by given path

 * `{String|Array} path` - path to array.
 * `{Number|Object} indexOrProps` - index or props to find item index.
 * `{Number} newIndex` - new item position. 