var CarrierRecoveryBuilder = (function () {
    'use strict';

    _CarrierRecoveryBuilder.$inject = [];

    function _CarrierRecoveryBuilder() {

        function build(samplesPerPeriod) {
            return new CarrierRecovery(samplesPerPeriod);
        }

        return {
            build: build
        };
    }

    return new _CarrierRecoveryBuilder();        // TODO change it to dependency injection

})();
