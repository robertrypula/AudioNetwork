var AbstractValueCollector = (function () {
    'use strict';

    _AbstractValueCollector.$inject = [];

    function _AbstractValueCollector() {
        var AVC;

        AVC = function () {
            this.$$valueList = [];
            this.$$lastFinalizedSize = null;
        };

        AVC.prototype.collect = function (value) {
            this.$$valueList.push(value);
        };

        AVC.prototype.getSize = function () {
            return this.$$valueList.length;
        };

        AVC.prototype.clear = function () {
            this.$$valueList.length = 0;
        };

        AVC.prototype.finalize = function () {
            var finalizeResult;

            this.$$lastFinalizedSize = this.getSize();
            finalizeResult = this.$$finalize();
            this.clear();

            return finalizeResult;
        };

        AVC.prototype.getLastFinalizedSize = function () {
            return this.$$lastFinalizedSize;
        };

        AVC.prototype.$$finalize = function () {
            throw 'Virtual method called!';
        };

        return AVC;
    }

    return _AbstractValueCollector();        // TODO change it to dependency injection

})();
