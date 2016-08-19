// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerCore.ReceiveMulticoreWorker', _ReceiveMulticoreWorker);

    _ReceiveMulticoreWorker.$inject = [
        'PhysicalLayerCore.ReceiveMulticoreWorkerThread',
        'Common.StopwatchBuilder'
    ];

    function _ReceiveMulticoreWorker(
        ReceiveMulticoreWorkerThread,
        StopwatchBuilder
    ) {
        var ReceiveMulticoreWorker;

        ReceiveMulticoreWorker = function () {
            if (AudioNetwork.bootConfig.multicoreState === AudioNetwork.MULTICORE_STATE.DISABLED) {
                throw ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION;
            }

            this.$$stopwatch = StopwatchBuilder.build();
            var js = ReceiveMulticoreWorkerThread.getJavaScriptCode();
            var blob = new Blob(
                [ js ],
                { type: 'application/javascript' }
            );

            this.$$worker = new Worker(URL.createObjectURL(blob));
            this.$$worker.onmessage = this.onMessage.bind(this);
        };

        ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION = 'Multicore support is not enabled';

        ReceiveMulticoreWorker.prototype.onMessage = function(oEvent) {
            var m = oEvent.data;

            if (m === 'ready') {
                console.log(':: thread started ::');
                this.$$stopwatch.start();
                this.$$worker.postMessage("some crazy sine sum");
            } else {
                console.log(":: thread stopped ::");
                console.log("Thread message: " + oEvent.data);
                console.log("Thread time: " + this.$$stopwatch.stop().getDuration(true) + ' seconds');
                this.$$worker.terminate();
            }

        };

        return ReceiveMulticoreWorker;
    }

})();
