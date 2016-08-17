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

        ReceiveMulticoreWorker.prototype.onMessage = function(oEvent) {
            console.log("Worker finished: " + oEvent.data);
            this.$$worker.terminate();
        };

        return ReceiveMulticoreWorker;
    }

})();
