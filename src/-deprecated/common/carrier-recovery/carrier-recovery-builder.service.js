// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
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

        function build(samplePerPeriod, samplePerDftWindow) {
            return new CarrierRecovery(samplePerPeriod, samplePerDftWindow);
        }

        return {
            build: build
        };
    }

})();
