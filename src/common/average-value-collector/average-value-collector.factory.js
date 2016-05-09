(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.AverageValueCollector', _AverageValueCollector);

    _AverageValueCollector.$inject = [
        'Common.AbstractValueCollector',
        'Common.Util'
    ];

    function _AverageValueCollector(
        AbstractValueCollector,
        Util
    ) {
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

})();
