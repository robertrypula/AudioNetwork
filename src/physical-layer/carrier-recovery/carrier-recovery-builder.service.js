var CarrierRecoveryBuilder = (function () {
    'use strict';

    _CarrierRecoveryBuilder.$inject = [];

    function _CarrierRecoveryBuilder() {

        function build(samplePerPeriod, sizeDFT) {
            return new CarrierRecovery(samplePerPeriod, sizeDFT);
        }

        return {
            build: build
        };
    }

    return new _CarrierRecoveryBuilder();        // TODO change it to dependency injection

})();
