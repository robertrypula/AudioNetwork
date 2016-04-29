var AbstractValueCollector = (function () {
    'use strict';

    _AbstractValueCollector.$inject = [];

    function _AbstractValueCollector() {
        var AVC;

        AVC = function () {
            this.$$valueList = [];
            this.$$lastFinalizedSize = undefined;
            this.$$lastFinalizedResult = undefined;
        };

        AVC.prototype.collect = function (value) {
            this.$$valueList.push(value);
        };

        AVC.prototype.getSize = function () {
            return this.$$valueList.length;
        };

        AVC.prototype.clear = function () {
            this.$$valueList.length = 0;
            this.$$lastFinalizedSize = undefined;
            this.$$lastFinalizedResult = undefined;
        };

        AVC.prototype.finalize = function () {
            this.$$lastFinalizedSize = this.getSize();
            this.$$lastFinalizedResult = this.$$finalize();
            this.$$valueList.length = 0;

            return this.$$lastFinalizedResult;
        };

        AVC.prototype.getLastFinalizedSize = function () {
            return this.$$lastFinalizedSize;
        };

        AVC.prototype.getLastFinalizedResult = function () {
            return this.$$lastFinalizedResult;
        };

        AVC.prototype.$$finalize = function () {
            throw 'Virtual method called!';
        };

        return AVC;
    }

    return _AbstractValueCollector();        // TODO change it to dependency injection

})();
