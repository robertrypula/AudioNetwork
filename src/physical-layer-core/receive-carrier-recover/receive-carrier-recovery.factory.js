// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerCore.ReceiveCarrierRecovery', _ReceiveCarrierRecovery);

    _ReceiveCarrierRecovery.$inject = [
    ];

    function _ReceiveCarrierRecovery(
    ) {
        var ReceiveCarrierRecovery;

        ReceiveCarrierRecovery = function () {
            this.$$worker = new Worker("/src/physical-layer-core/receive-carrier-recovery-worker/receive-carrier-recovery-worker.factory.js");

            this.$$worker.onmessage = function (oEvent) {
                console.log("Worker said: " + oEvent.data);
            };

            this.$$worker.postMessage("Hello, I just send you message");
        };

        return ReceiveCarrierRecovery;
    }

})();
