var GuardPowerCollector = (function () {
    'use strict';

    _GuardPowerCollector.$inject = [];

    function _GuardPowerCollector() {
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

    return _GuardPowerCollector();        // TODO change it to dependency injection

})();
