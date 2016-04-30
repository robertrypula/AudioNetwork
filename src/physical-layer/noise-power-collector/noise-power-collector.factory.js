var NoisePowerCollector = (function () {
    'use strict';

    _NoisePowerCollector.$inject = [];

    function _NoisePowerCollector() {
        var NPC;

        NPC = function () {
            AbstractValueCollector.apply(this, arguments);
        };

        NPC.prototype = Object.create(AbstractValueCollector.prototype);
        NPC.prototype.constructor = NPC;

        NPC.prototype.$$finalize = function () {
            if (this.$$valueList.length === 0) {
                throw 'Cannot finalize NoisePowerCollector without any samples colleted';
            }

            return AudioUtil.computeAverage(this.$$valueList);
        };

        return NPC;
    }

    return _NoisePowerCollector();        // TODO change it to dependency injection

})();
