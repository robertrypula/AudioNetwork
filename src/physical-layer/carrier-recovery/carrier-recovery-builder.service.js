var CarrierRecoveryBuilder = (function () {
    'use strict';

    _CarrierRecoveryBuilder.$inject = [];

    function _CarrierRecoveryBuilder() {

        function build(samplePerPeriod, dftWindowSize) {
            return new CarrierRecovery(samplePerPeriod, dftWindowSize);
        }

        return {
            build: build
        };
    }

    return new _CarrierRecoveryBuilder();        // TODO change it to dependency injection

})();
