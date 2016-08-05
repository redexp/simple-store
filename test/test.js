var expect = require('chai').expect;

var SimpleStore = require('../simple-store');

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

        store.on('change', function (e) {
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

        store.on('change', function (e) {
            count++;
        });

        count = 0;
        store.set('prop0.prop1', 'name1');
        expect(count).to.equal(1);

        count = 0;
        store.off();
        store.set('prop0.prop1', 'name01');
        expect(count).to.equal(0);
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