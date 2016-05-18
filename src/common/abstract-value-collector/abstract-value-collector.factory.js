// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.AbstractValueCollector', _AbstractValueCollector);

    _AbstractValueCollector.$inject = [];

    function _AbstractValueCollector() {
        var AVC;

        AVC = function () {
            this.$$valueList = [];
            this.$$lastFinalizedSize = undefined;
            this.$$lastFinalizedResult = undefined;
        };

        AVC.ABSTRACT_METHOD_CALLED_EXCEPTION = 'Abstract method called!';

        AVC.prototype.collect = function (value) {
            this.$$valueList.push(value);
        };

        AVC.prototype.hasAtLeastItem = function () {
            return this.getSize() > 0;
        };

        AVC.prototype.getSize = function () {
            return this.$$valueList.length;
        };

        AVC.prototype.clearAll = function () {
            this.clearList();
            this.$$lastFinalizedSize = undefined;
            this.$$lastFinalizedResult = undefined;
        };

        AVC.prototype.clearList = function () {
            this.$$valueList.length = 0;
        };

        AVC.prototype.finalize = function () {
            this.$$lastFinalizedResult = this.$$finalize(); // $$finalize() method may throw error BEFORE assignment
            this.$$lastFinalizedSize = this.getSize();
            this.clearList();

            return this.$$lastFinalizedResult;
        };

        /**
         * Returns list size that was used to compute last successful result from finalize method.
         */
        AVC.prototype.getLastFinalizedSize = function () {
            return this.$$lastFinalizedSize;
        };

        /**
         * Returns last successful result from finalize method.
         */
        AVC.prototype.getLastFinalizedResult = function () {
            return this.$$lastFinalizedResult;
        };

        AVC.prototype.$$finalize = function () {
            throw AVC.ABSTRACT_METHOD_CALLED_EXCEPTION;
        };

        return AVC;
    }

})();
