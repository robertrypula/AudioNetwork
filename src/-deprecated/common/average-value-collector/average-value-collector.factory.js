// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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
        var AverageValueCollector;

        AverageValueCollector = function () {
            AbstractValueCollector.apply(this, arguments);
        };

        AverageValueCollector.prototype = Object.create(AbstractValueCollector.prototype);
        AverageValueCollector.prototype.constructor = AverageValueCollector;

        AverageValueCollector.EMPTY_LIST_EXCEPTION = 'Cannot finalize AverageValueCollector without any samples collected';

        AverageValueCollector.prototype.$$finalize = function () {
            if (this.$$valueList.length === 0) {
                throw AverageValueCollector.EMPTY_LIST_EXCEPTION;
            }

            return Util.computeAverage(this.$$valueList);
        };

        return AverageValueCollector;
    }

})();
