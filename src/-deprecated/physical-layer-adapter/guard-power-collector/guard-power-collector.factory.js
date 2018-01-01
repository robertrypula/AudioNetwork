// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerAdapter.GuardPowerCollector', _GuardPowerCollector);

    _GuardPowerCollector.$inject = [
        'Common.AbstractValueCollector',
        'Common.MathUtil'
    ];

    function _GuardPowerCollector(
        AbstractValueCollector,
        MathUtil
    ) {
        var GuardPowerCollector;

        GuardPowerCollector = function () {
            AbstractValueCollector.apply(this, arguments);
        };

        GuardPowerCollector.prototype = Object.create(AbstractValueCollector.prototype);
        GuardPowerCollector.prototype.constructor = GuardPowerCollector;

        GuardPowerCollector.EMPTY_LIST_EXCEPTION = 'Cannot finalize GuardPowerCollector without any samples collected';

        GuardPowerCollector.prototype.$$finalize = function () {
            if (this.$$valueList.length === 0) {
                throw GuardPowerCollector.EMPTY_LIST_EXCEPTION;
            }
            
            return MathUtil.minInArray(this.$$valueList);
        };

        return GuardPowerCollector;
    }

})();
