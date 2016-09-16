simple-state-store
==================

[![Build Status](https://travis-ci.org/redexp/simple-store.svg?branch=master)](https://travis-ci.org/redexp/simple-store)

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

Lib will look for CommonJS or AMD or will add global class called `SimpleStore`.

# Constructor

`new SimleStore([state,] [options])`

## Constructor options

Any option from [simple-diff](https://github.com/redexp/simple-diff)

# Properties

## `.state`

Holds current state of the store.

## `.options`

Holds options passed to the constructor.

# Methods

## `.get(path)`

 * `{String|Array} path` - path to property in store state.

Returns data for given path. Path can be as dots divided string like `'prop1.prop2'` or an array `['prop1', 'prop2']`. You can use object in array path like `['prop1', {id: 2}, 'name']` which means that `prop1` is an array and object `{id: 2}` should be replaced with index of item which match this object. 

## `.set([path,] data)`

 * `{String|Array} path` - path to property in store state. If you want to change root state you can use or empty string or empty array or just skip this argument like `.set(newState)`
 * `{*} data` - new data for given path

When you call it with object it will look deeply into it and compare with old object in given path and will trigger event not once but for all changed deep properties. So you can modify properties in same object like this

```javascript
store.set('prop1.prop2.name', 'Jack');
store.set('prop1.prop2.age', 30);
// or
store.set('prop1.prop2', {
    name: 'Jack',
    age: 30
});
```

## `.remove(path)`
 
 * `{String|Array} path` - path to property in store state.

Removes property in state and triggers `remove` event.

## `.getIdProp([path])`

 * `{String|Array} path` - path to property in store state.
 
Will return name of id property by comparing your `path` with store config

```javascript
var store = new SimpleStateStore({list: [], user: {friends: []}}, {
    idProp: "_id", // default is "id"
    idProps: {
        'user.friends': 'cid',
        'user.friends.*.followers': 'id',
    }
});

store.getIdProp(); // => "_id"
store.getIdProp('list'); // => "_id"
store.getIdProp('user.friends'); // => "cid"
store.getIdProp('user.friends.*.followers'); // => "id"
store.getIdProp('user.friends.1.followers'); // => "id"
store.getIdProp('user.friends.*.followers.*.likes'); // => "_id"
```

## `.on(events, path, callback)`

 * `{String} events` - space divided events names
 * `{String|Array} path` - path to property in store state. Also you can use `*` in path which will match any property name. 
 * `{Function} callback` - observer function
  
## `.off([events,] [path,] [callback])`

Regular off function to remove observers.

 * `.off(events)` - remove all observers of given space divided events names
 * `.off(events, path)` - remove all observers of given event name in given path
 * `.off(events, path, callback)` - remove exact observer
 * `.off(pathAsArray)` - remove all events of given path
 * `.off(pathAsArray, callback)` - remove exact observer from all events of given path
 
## `.trigger(event, path, [data1, ...])`

 * `{String|Object} event` - event name or event object with structure like `{type: 'event-name', path: array || string}`. If event object given then all arguments passed to this method will go to observers.
 * `{String|Array} path` - path to property in store state.
 * `{*} data1` - any data for observers
 
## `.getItem(path, props)`
 
Find object by given props in array by given path.
 
 * `{String|Array} path` - path to array.
 * `{Object} props` - criteria props to find an object.
 
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
 * `{Number} newIndex` - new item index. 