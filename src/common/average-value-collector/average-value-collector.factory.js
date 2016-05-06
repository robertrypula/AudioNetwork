var AverageValueCollector = (function () {
    'use strict';

    _AverageValueCollector.$inject = [];

    function _AverageValueCollector() {
        var AVC;

        AVC = function () {
            AbstractValueCollector.apply(this, arguments);
        };

        AVC.prototype = Object.create(AbstractValueCollector.prototype);
        AVC.prototype.constructor = AVC;

        AVC.EMPTY_LIST_EXCEPTION = 'Cannot finalize AverageValueCollector without any samples collected';

        AVC.prototype.$$finalize = function () {
            if (this.$$valueList.length === 0) {
                throw AVC.EMPTY_LIST_EXCEPTION;
            }

            return Util.computeAverage(this.$$valueList);
        };

        return AVC;
    }

    return _AverageValueCollector();        // TODO change it to dependency injection

})();
