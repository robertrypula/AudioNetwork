// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.GuardPowerCollector', _GuardPowerCollector);

    _GuardPowerCollector.$inject = [
        'Common.AbstractValueCollector',
        'Common.MathUtil'
    ];

    function _GuardPowerCollector(
        AbstractValueCollector,
        MathUtil
    ) {
        var GPC;

        GPC = function () {
            AbstractValueCollector.apply(this, arguments);
        };

        GPC.prototype = Object.create(AbstractValueCollector.prototype);
        GPC.prototype.constructor = GPC;

        GPC.EMPTY_LIST_EXCEPTION = 'Cannot finalize GuardPowerCollector without any samples collected';

        GPC.prototype.$$finalize = function () {
            if (this.$$valueList.length === 0) {
                throw GPC.EMPTY_LIST_EXCEPTION;
            }
            
            return MathUtil.minInArray(this.$$valueList);
        };

        return GPC;
    }

})();
