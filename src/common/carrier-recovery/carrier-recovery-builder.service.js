// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.CarrierRecoveryBuilder', _CarrierRecoveryBuilder);

    _CarrierRecoveryBuilder.$inject = [
        'Common.CarrierRecovery'
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
