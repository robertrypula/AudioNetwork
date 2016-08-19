// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerCore.ReceiveMulticoreWorker', _ReceiveMulticoreWorker);

    _ReceiveMulticoreWorker.$inject = [
        'PhysicalLayerCore.ReceiveMulticoreWorkerThread'
    ];

    function _ReceiveMulticoreWorker(
        ReceiveMulticoreWorkerThread
    ) {
        var ReceiveMulticoreWorker;

        ReceiveMulticoreWorker = function () {
            if (AudioNetwork.bootConfig.multicoreState === AudioNetwork.MULTICORE_STATE.DISABLED) {
                throw ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION;
            }

            var js = ReceiveMulticoreWorkerThread.getJavaScriptCode();
            var blob = new Blob(
                [ js ],
                { type: 'application/javascript' }
            );

            this.$$worker = new Worker(URL.createObjectURL(blob));
            this.$$worker.onmessage = this.onMessage.bind(this);

            console.log('before post');
            this.$$worker.postMessage("Hello, I just send you message");
            console.log('after post');
        };

        ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION = 'Multicore support is not enabled';

        ReceiveMulticoreWorker.prototype.onMessage = function(oEvent) {
            console.log("Worker finished: " + oEvent.data);
            this.$$worker.terminate();
        };

        return ReceiveMulticoreWorker;
    }

})();
