// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.SimplePromise', _SimplePromise);

    _SimplePromise.$inject = [];

    function _SimplePromise() {
        var SimplePromise;

        SimplePromise = function () {
            this.$$state = null;
            this.$$value = undefined;
            this.$$then = null;
            this.$$catch = null;
            this.$$finally = null;
        };

        SimplePromise.$$STATE_RESOLVE = 0;
        SimplePromise.$$STATE_REJECT = 1;

        SimplePromise.prototype.$$callbackInvoke = function () {
            switch (this.$$state) {
                case SimplePromise.$$STATE_RESOLVE:
                    if (this.$$then) {
                        this.$$then(this.$$value);
                        this.$$then = null;
                    }
                    if (this.$$finally) {
                        this.$$finally(this.$$value);
                        this.$$finally = null;
                    }
                    break;
                case SimplePromise.$$STATE_REJECT:
                    if (this.$$catch) {
                        this.$$catch(value);
                        this.$$catch = null;
                    }
                    if (this.$$finally) {
                        this.$$finally(value);
                        this.$$finally = null;
                    }
                    break;
            }
        };

        SimplePromise.prototype.resolve = function (value) {
            if (this.$$state !== null) {
                return;
            }

            this.$$state = SimplePromise.$$STATE_RESOLVE;
            this.$$value = value;
            this.$$callbackInvoke();
        };

        SimplePromise.prototype.reject = function (value) {
            if (this.$$state !== null) {
                return;
            }

            this.$$state = SimplePromise.$$STATE_REJECT;
            this.$$value = value;
            this.$$callbackInvoke();
        };

        SimplePromise.prototype.then = function (callback) {
            if (typeof callback === 'function') {
                this.$$then = callback;
            }
            this.$$callbackInvoke();
            return this;
        };

        SimplePromise.prototype.catch = function (callback) {
            if (typeof callback === 'function') {
                this.$$catch = callback;
            }
            this.$$callbackInvoke();
            return this;
        };

        SimplePromise.prototype.finally = function (callback) {
            if (typeof callback === 'function') {
                this.$$finally = callback;
            }
            this.$$callbackInvoke();
            return this;
        };

        return SimplePromise;
    }

})();
