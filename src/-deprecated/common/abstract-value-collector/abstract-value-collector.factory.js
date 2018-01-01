// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.AbstractValueCollector', _AbstractValueCollector);

    _AbstractValueCollector.$inject = [];

    function _AbstractValueCollector() {
        var AbstractValueCollector;

        AbstractValueCollector = function () {
            this.$$valueList = [];
            this.$$lastFinalizedSize = undefined;
            this.$$lastFinalizedResult = undefined;
        };

        AbstractValueCollector.ABSTRACT_METHOD_CALLED_EXCEPTION = 'Abstract method called!';

        AbstractValueCollector.prototype.collect = function (value) {
            this.$$valueList.push(value);
        };

        AbstractValueCollector.prototype.hasAtLeastItem = function () {
            return this.getSize() > 0;
        };

        AbstractValueCollector.prototype.getSize = function () {
            return this.$$valueList.length;
        };

        AbstractValueCollector.prototype.clearAll = function () {
            this.clearList();
            this.$$lastFinalizedSize = undefined;
            this.$$lastFinalizedResult = undefined;
        };

        AbstractValueCollector.prototype.clearList = function () {
            this.$$valueList.length = 0;
        };

        AbstractValueCollector.prototype.finalize = function () {
            this.$$lastFinalizedResult = this.$$finalize(); // $$finalize() method may throw error BEFORE assignment
            this.$$lastFinalizedSize = this.getSize();
            this.clearList();

            return this.$$lastFinalizedResult;
        };

        /**
         * Returns list size that was used to compute last successful result from finalize method.
         */
        AbstractValueCollector.prototype.getLastFinalizedSize = function () {
            return this.$$lastFinalizedSize;
        };

        /**
         * Returns last successful result from finalize method.
         */
        AbstractValueCollector.prototype.getLastFinalizedResult = function () {
            return this.$$lastFinalizedResult;
        };

        AbstractValueCollector.prototype.$$finalize = function () {
            throw AbstractValueCollector.ABSTRACT_METHOD_CALLED_EXCEPTION;
        };

        return AbstractValueCollector;
    }

})();
