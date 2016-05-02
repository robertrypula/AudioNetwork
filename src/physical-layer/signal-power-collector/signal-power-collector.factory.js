var SignalPowerCollector = (function () {
    'use strict';

    _SignalPowerCollector.$inject = [];

    function _SignalPowerCollector() {
        var SPC;

        SPC = function () {
            AbstractValueCollector.apply(this, arguments);
        };

        SPC.EMPTY_LIST_EXCEPTION = 'Cannot finalize SignalPowerCollector without any samples collected';

        SPC.prototype = Object.create(AbstractValueCollector.prototype);
        SPC.prototype.constructor = SPC;

        SPC.prototype.$$finalize = function () {
            if (this.$$valueList.length === 0) {
                throw SPC.EMPTY_LIST_EXCEPTION;
            }
            
            return MathUtil.maxInArray(this.$$valueList);
        };

        return SPC;
    }

    return _SignalPowerCollector();        // TODO change it to dependency injection

})();
