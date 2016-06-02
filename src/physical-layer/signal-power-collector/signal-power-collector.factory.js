// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.SignalPowerCollector', _SignalPowerCollector);

    _SignalPowerCollector.$inject = [
        'Common.AbstractValueCollector',
        'Common.MathUtil'
    ];

    function _SignalPowerCollector(
        AbstractValueCollector,
        MathUtil
    ) {
        var SignalPowerCollector;

        SignalPowerCollector = function () {
            AbstractValueCollector.apply(this, arguments);
        };

        SignalPowerCollector.EMPTY_LIST_EXCEPTION = 'Cannot finalize SignalPowerCollector without any samples collected';

        SignalPowerCollector.prototype = Object.create(AbstractValueCollector.prototype);
        SignalPowerCollector.prototype.constructor = SignalPowerCollector;

        SignalPowerCollector.prototype.$$finalize = function () {
            if (this.$$valueList.length === 0) {
                throw SignalPowerCollector.EMPTY_LIST_EXCEPTION;
            }
            
            return MathUtil.maxInArray(this.$$valueList);
        };

        return SignalPowerCollector;
    }

})();
