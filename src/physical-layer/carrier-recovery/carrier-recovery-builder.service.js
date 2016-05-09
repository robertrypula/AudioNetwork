(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.CarrierRecoveryBuilder', _CarrierRecoveryBuilder);

    _CarrierRecoveryBuilder.$inject = [
        'PhysicalLayer.CarrierRecovery'
    ];

    function _CarrierRecoveryBuilder(
        CarrierRecovery
    ) {

        function build(samplePerPeriod, dftWindowSize) {
            return new CarrierRecovery(samplePerPeriod, dftWindowSize);
        }

        return {
            build: build
        };
    }

})();
