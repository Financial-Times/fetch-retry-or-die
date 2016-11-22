'use strict';
const expect = require('expectations');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const defer = () => {
    let resolve, reject;
    const promise = new Promise(() => {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        promise: promise,
        resolve: resolve,
        reject: reject
    };
};

describe('fetch-retry-or-die', () => {

    let fetch;
    let myFetch;

    let def1, def2, def3, thenFn, catchFn;

    // before
    beforeEach(() => {
        let stubs;
        def1 = defer();
        def2 = defer();
        def3 = defer();
        fetch = sinon.stub();
        fetch.onCall(0).returns(def1.promise);
        fetch.onCall(1).returns(def2.promise);
        fetch.onCall(2).returns(def3.promise);
        stubs = {
            'isomorphic-fetch': fetch
        };
        myFetch = proxyquire('./', stubs);
    });

    describe('[maxRetries=3]', () => {

        beforeEach(() => {
            thenFn = sinon.spy();
            catchFn = sinon.spy();
            myFetch('http://whatever.url', {maxRetries:3}).then(thenFn).catch(catchFn);
        });

        // first call fails
        describe('-> #1 fails', () => {

            beforeEach(() => {
                def1.reject();
            });

            // second call works
            describe('-> #2 works', () => {

                beforeEach(() => {
                    def2.resolve();
                });

                describe('it resolved and', () => {

                    it('should execute then callback', () => {
                        expect(thenFn.called).toBe(true);
                    });

                    it('should call fetch twice', () => {
                        expect(fetch.callCount).toBe(2);
                    });
                });
            });

            // second call fails
            describe('-> #2 fails', () => {

                beforeEach(() => {
                    def2.reject();
                });

                // third call works
                describe('-> #3 works', () => {

                    beforeEach(() => {
                        def3.resolve();
                    });

                    describe('it resolved and', () => {

                        it('should execute then callback', () => {
                            expect(thenFn.called).toBe(true);
                        });

                        it('should call fetch 3 times', () => {
                            expect(fetch.callCount).toBe(3);
                        });
                    });
                });

                // third call fails
                describe('-> #3 fails', () => {

                    beforeEach(() => {
                        def3.reject();
                    });

                    describe('it rejects and', function() {

                        it('invokes the catch callback', function() {
                            expect(catchFn.called).toBe(true);
                        });

                        it('does not call fetch again', function() {
                            expect(fetch.callCount).toBe(3);
                        });

                    });

                });
            });
        });
    });

});