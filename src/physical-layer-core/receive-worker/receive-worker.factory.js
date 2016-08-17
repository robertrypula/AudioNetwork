// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerCore.ReceiveWorker', _ReceiveWorker);

    _ReceiveWorker.$inject = [
        'Common.CarrierRecoveryBuilder'
    ];

    function _ReceiveWorker(
        CarrierRecoveryBuilder
    ) {
        var ReceiveWorker;

        ReceiveWorker = function () {
            this.$$carrierRecovery = CarrierRecoveryBuilder.build(16, 1024);
        };

        return ReceiveWorker;
    }

})();
