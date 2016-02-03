var CarrierRecoveryBuilder = (function () {
    'use strict';

    _CarrierRecoveryBuilder.$inject = [];

    function _CarrierRecoveryBuilder() {

        function build(samplePerPeriod) {
            return new CarrierRecovery(samplePerPeriod);
        }

        return {
            build: build
        };
    }

    return new _CarrierRecoveryBuilder();        // TODO change it to dependency injection

})();
