'use strict';
const expect = require('expectations');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const logger = require('@financial-times/n-logger').default;

const defer = () => {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {
        promise: promise,
        resolve: resolve,
        reject: reject
    };
};

describe('fetch-retry-or-die', () => {
    // libraries
    let fetch, myFetch;

    // fake promises
    let def1, def2, def3, def4;
    let thenFn, catchFn;

    // sinon
    let stubs, clock, delay, errorMessageStub, warnMessageStub, logMessages = [];

    before(() => {
        errorMessageStub = sinon.stub(logger, 'error', (obj) => {
            logMessages.push(obj);
        });
        warnMessageStub = sinon.stub(logger, 'warn', (obj) => {
            logMessages.push(obj);
        });
    });

    after(() => {
        errorMessageStub.restore();
        warnMessageStub.restore();
    });

    beforeEach(() => {
        delay = 101;
        clock = sinon.useFakeTimers();
        def1 = defer();
        def2 = defer();
        def3 = defer();
        def4 = defer();
        fetch = sinon.stub();
        fetch.onCall(0).returns(def1.promise);
        fetch.onCall(1).returns(def2.promise);
        fetch.onCall(2).returns(def3.promise);
        fetch.onCall(3).returns(def4.promise);
        stubs = {
            'isomorphic-fetch': fetch
        };
        myFetch = proxyquire("./index", stubs);
    });

    afterEach(() => {
        clock.restore();
        logMessages = [];
    });

    describe('[maxRetries=3]', () => {

        beforeEach(() => {
            thenFn = sinon.spy();
            catchFn = sinon.spy();
            myFetch('http://whatever.url', {maxRetries:3}).then(thenFn).catch(catchFn);
        });

        // first call works
        describe('-> #1 works', () => {

            beforeEach(() => {
                def1.resolve({status: 200});
            });

            describe('it resolves and', () => {

                it('should execute then callback', () => {
                    expect(thenFn.called).toBe(true);
                });

                it('should call fetch twice', () => {
                    expect(fetch.callCount).toBe(1);
                });
            });
        });

        // first call fails
        describe('-> #1 fails', () => {

            beforeEach(() => {
                def1.reject(new Error('Fake rejecting #1'));
            });

            // second call works
            describe('-> #2 works', () => {

                beforeEach(() => {
                    clock.tick(delay);
                    def2.resolve({status: 200});
                });

                describe('it resolves and', () => {

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
                    def2.reject(new Error('Fake rejecting #2'));
                    clock.tick(delay);
                });

                // third call works
                describe('-> #3 works', () => {

                    beforeEach(() => {
                        def3.resolve({status: 200});
                        clock.tick(delay);
                    });

                    describe('it resolves and', () => {

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
                        def3.reject(new Error('Fake rejecting #3'));
                        clock.tick(delay);
                    });

                    // fourth call works
                    describe('-> #4 works', () => {

                        beforeEach(() => {
                            def4.resolve({status: 200});
                            clock.tick(delay);
                        });

                        describe('it resolves and', () => {

                            it('should execute then callback', () => {
                                expect(thenFn.called).toBe(true);
                            });

                            it('should call fetch 4 times', () => {
                                expect(fetch.callCount).toBe(4);
                            });
                        });
                    });

                    // fourth call works
                    describe('-> #4 fails', () => {
                        let count = 0;
                        beforeEach(() => {
                            def4.reject(new Error(++count));
                            clock.tick(delay);
                        });

                        describe('it rejects and', () => {

                            it('invokes the catch callback', () => {
                                expect(catchFn.called).toBe(true);
                            });

                            it('does not call fetch again', () => {
                                expect(fetch.callCount).toBe(4);
                            });

                        });
                    });

                });
            });
        });
    });
});
