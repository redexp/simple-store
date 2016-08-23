var expect = require('chai').expect;
var sinon = require('sinon');

require('chai').use(require('sinon-chai'));

var SimpleStore = require('../simple-state-store');

describe('SimpleStore', function () {
    it('should handle events', function () {
        var store = new SimpleStore({
            prop0: {
                prop1: 'name1'
            }
        });

        var count = 0,
            cb;

        store.on('change', 'prop0.prop1', cb = function (e) {
            count++;
            expect(store.state).to.deep.equal({
                prop0: {
                    prop1: 'name01'
                }
            });

            expect(e.newPath).to.deep.equal(['prop0', 'prop1']);
            expect(e.oldValue).to.equal('name1');
            expect(e.newValue).to.equal('name01');
        });

        store.on('change', ['prop0', 'prop1'], function (e) {
            count++;

            expect(e.newPath).to.deep.equal(['prop0', 'prop1']);
        });

        store.on('change', ['prop0', '*'], function (e) {
            count++;

            expect(e.newPath).to.deep.equal(['prop0', 'prop1']);
        });

        store.set('prop0.prop1', 'name01');

        expect(count).to.equal(3);

        count = 0;
        store.off('change', 'prop0.prop1', cb);
        store.set('prop0.prop1', 'name001');
        expect(count).to.equal(2);

        count = 0;
        store.off('change', 'prop0.prop1');
        store.set('prop0.prop1', 'name0001');
        expect(count).to.equal(1);

        count = 0;
        store.off('change');
        store.set('prop0.prop1', 'name00001');
        expect(count).to.equal(0);
    });

    it('should handle multiple events', function () {
        var store = new SimpleStore();

        var callback = sinon.spy();

        store.on('test1 test2', [], callback);
        store.trigger('test1', [], 'one');

        expect(callback)
            .to.have.been.callCount(1)
            .and.have.been.calledWith('one')
        ;

        store.trigger('test2', [], 'two');

        expect(callback)
            .to.have.been.callCount(2)
            .and.have.been.calledWith('two')
        ;
    });

    it('should off events by path only', function () {
        var store = new SimpleStore();

        var callback = sinon.spy();
        store.on('test1', 'prop1', callback);
        store.on('test2', 'prop2', callback);
        store.on('test3', 'prop2', callback);

        var callback2 = sinon.spy();
        store.on('test4', 'prop2', callback2);

        store.trigger('test1', 'prop1');
        expect(callback).to.have.been.callCount(1);
        store.trigger('test2', 'prop2');
        expect(callback).to.have.been.callCount(2);
        store.trigger('test3', 'prop2');
        expect(callback).to.have.been.callCount(3);
        store.trigger('test4', 'prop2');
        expect(callback2).to.have.been.callCount(1);

        store.off(['prop2'], callback2);

        store.trigger('test1', 'prop1');
        expect(callback).to.have.been.callCount(4);
        store.trigger('test2', 'prop2');
        expect(callback).to.have.been.callCount(5);
        store.trigger('test3', 'prop2');
        expect(callback).to.have.been.callCount(6);
        store.trigger('test4', 'prop2');
        expect(callback2).to.have.been.callCount(1);

        store.off(['prop2']);

        store.trigger('test1', 'prop1');
        expect(callback).to.have.been.callCount(7);
        store.trigger('test2', 'prop2');
        expect(callback).to.have.been.callCount(7);
        store.trigger('test3', 'prop2');
        expect(callback).to.have.been.callCount(7);
        store.trigger('test4', 'prop2');
        expect(callback2).to.have.been.callCount(1);
    });

    it('should trigger and catch multiple arguments', function () {
        var store = new SimpleStore();

        var callback = sinon.spy();
        store.on('test', [], callback);
        store.trigger('test', [], 'one', 'two', 'three');

        expect(callback).to.have.been.calledWith('one', 'two', 'three');

        store.on('test2', [], callback);
        var event = {
            type: 'test2',
            path: []
        };
        store.trigger(event, 'one', 'two');

        expect(callback).to.have.been.calledWith(event, 'one', 'two');
    });

    it('should handle objects in path', function () {
        var store = new SimpleStore({
            prop0: [
                {id: 1, name: 'value1'},
                {id: 2, name: 'value2'},
                {id: 3, name: 'value3'}
            ]
        });

        var cb = sinon.spy();
        store.on('change', ['prop0', {id: 2}, 'name'], cb);

        store.set(['prop0', {id: 2}, 'name'], 'value02');

        expect(cb).to.have.been.callCount(1);
        expect(cb.args[0][0].newPath).to.deep.equal(['prop0', 1, 'name']);
        expect(cb.args[0][0].oldValue).to.equal('value2');
        expect(cb.args[0][0].newValue).to.equal('value02');

        store.moveItem('prop0', {id: 2}, 0);

        store.set(['prop0', {id: 2}, 'name'], 'value002');

        expect(cb).to.have.been.callCount(2);
        expect(cb.args[1][0].newPath).to.deep.equal(['prop0', 0, 'name']);
        expect(cb.args[1][0].oldValue).to.equal('value02');
        expect(cb.args[1][0].newValue).to.equal('value002');
    });

    it('should handle set objects', function () {
        var store = new SimpleStore({
            prop0: {
                prop1: [
                    {id: 1},
                    {id: 2, name: 'name2'}
                ]
            }
        });

        var count = 0;

        store.on('move-item', 'prop0.prop1', function (e) {
            count++;

            expect(e.oldIndex).to.be.a.number;
            expect(e.newIndex).to.be.a.number;
        });

        store.on('change', 'prop0.prop1.*.name', function (e) {
            count++;

            expect(e.oldValue).to.equal('name2');
            expect(e.newValue).to.equal('name02');
        });

        store.set('prop0.prop1', [
            {id: 2, name: 'name02'},
            {id: 1}
        ]);

        expect(count).to.equal(2);
    });

    it('should get item by props', function () {
        var store = new SimpleStore({
            prop0: {
                prop1: [
                    {id: 1, name: 'name1'},
                    {id: 2, name: 'name2'}
                ]
            }
        });

        expect(store.getItem('prop0.prop1', {id: 2})).to.equal(store.state.prop0.prop1[1]);
    });

    it('should get item by props', function () {
        var store = new SimpleStore({
            prop0: {
                prop1: [
                    {id: 1, name: 'name1'},
                    {id: 2, name: 'name2'}
                ]
            }
        });

        expect(store.getIndex('prop0.prop1', {id: 2})).to.equal(1);
    });

    it('should add items in array', function () {
        var store = new SimpleStore({
            prop0: {
                prop1: [
                    {id: 1},
                    {id: 2}
                ]
            }
        });

        var count = 0;

        store.on('add-item', 'prop0.prop1', function (e) {
            count++;

            expect(e.oldIndex).to.be.a.number;
            expect(e.newIndex).to.be.a.number;
        });

        store.addItem('prop0.prop1', {id: 3});

        expect(count).to.equal(1);
        expect(store.state).to.deep.equal({
            prop0: {
                prop1: [
                    {id: 1},
                    {id: 2},
                    {id: 3}
                ]
            }
        });

        store.addItem('prop0.prop1', {id: 4}, 1);

        expect(store.state).to.deep.equal({
            prop0: {
                prop1: [
                    {id: 1},
                    {id: 4},
                    {id: 2},
                    {id: 3}
                ]
            }
        });
    });

    it('should remove items in array', function () {
        var store = new SimpleStore({
            prop0: {
                prop1: [
                    {id: 1},
                    {id: 2},
                    {id: 3},
                    {id: 4}
                ]
            }
        });

        var count = 0;

        store.on('remove-item', 'prop0.prop1', function (e) {
            count++;

            expect(e.oldIndex).to.be.a.number;
            expect(e.newIndex).to.be.a.number;
        });

        store.removeItem('prop0.prop1', {id: 3});

        expect(count).to.equal(1);
        expect(store.state).to.deep.equal({
            prop0: {
                prop1: [
                    {id: 1},
                    {id: 2},
                    {id: 4}
                ]
            }
        });

        store.removeItem('prop0.prop1', 1);

        expect(store.state).to.deep.equal({
            prop0: {
                prop1: [
                    {id: 1},
                    {id: 4}
                ]
            }
        });
    });

    it('should move items in array', function () {
        var store = new SimpleStore({
            prop0: {
                prop1: [
                    {id: 1},
                    {id: 2},
                    {id: 3},
                    {id: 4}
                ]
            }
        });

        var count = 0;

        store.on('move-item', 'prop0.prop1', function (e) {
            count++;

            expect(e.oldIndex).to.be.a.number;
            expect(e.newIndex).to.be.a.number;
        });

        store.moveItem('prop0.prop1', {id: 3}, 0);

        expect(count).to.equal(1);

        expect(store.state).to.deep.equal({
            prop0: {
                prop1: [
                    {id: 3},
                    {id: 1},
                    {id: 2},
                    {id: 4}
                ]
            }
        });

        store.moveItem('prop0.prop1', 2, 0);

        expect(count).to.equal(2);

        expect(store.state).to.deep.equal({
            prop0: {
                prop1: [
                    {id: 2},
                    {id: 3},
                    {id: 1},
                    {id: 4}
                ]
            }
        });
    });
});