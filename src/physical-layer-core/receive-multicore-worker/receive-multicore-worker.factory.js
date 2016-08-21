// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerCore.ReceiveMulticoreWorker', _ReceiveMulticoreWorker);

    _ReceiveMulticoreWorker.$inject = [
        'PhysicalLayerCore.ReceiveMulticoreWorkerThread',
        'Common.SimplePromiseBuilder'
    ];

    function _ReceiveMulticoreWorker(
        ReceiveMulticoreWorkerThread,
        SimplePromiseBuilder
    ) {
        var ReceiveMulticoreWorker;

        ReceiveMulticoreWorker = function () {
            var threadCode, blob;

            if (AudioNetwork.bootConfig.multicoreState === AudioNetwork.MULTICORE_STATE.DISABLED) {
                throw ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION;
            }

            threadCode = ReceiveMulticoreWorkerThread.getJavaScriptCode();
            blob = new Blob(
                [ threadCode ],
                { type: 'application/javascript' }
            );

            this.$$worker = new Worker(URL.createObjectURL(blob));
            this.$$worker.onmessage = this.$$onMessage.bind(this);

            this.$$promiseThreadReady = SimplePromiseBuilder.build();
            this.$$promiseComputeCrazySineSum = undefined;
        };

        ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION = 'Multicore support is not enabled';
        ReceiveMulticoreWorker.PREVIOUS_PROMISE_NOT_RESOLVED_YET_EXCEPTION = 'Previous promise not resolved yet';

        ReceiveMulticoreWorker.THREAD_READY = 'THREAD_READY';

        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM = 'COMPUTE_CRAZY_SINE_SUM';
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM_SUCCESS = 'COMPUTE_CRAZY_SINE_SUM_SUCCESS';
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM_FAIL = 'COMPUTE_CRAZY_SINE_SUM_FAIL';

        ReceiveMulticoreWorker.prototype.destroy = function() {
            if (this.$$worker) {
                this.$$worker.terminate();
                this.$$worker = undefined;
            }
        };

        ReceiveMulticoreWorker.prototype.getThreadReadyPromise = function() {
            return this.$$promiseThreadReady;
        };

        ReceiveMulticoreWorker.prototype.$$onMessage = function(event) {
            var
                data = event.data,
                message = data.length > 0 ? data[0] : null,
                result = data.length > 1 ? data[1] : null;

            switch (message) {
                case ReceiveMulticoreWorker.THREAD_READY:
                    this.$$promiseThreadReady.resolve();
                    break;
                case ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM_SUCCESS:
                    this.$$promiseComputeCrazySineSum.resolve(result);
                    this.$$promiseComputeCrazySineSum = undefined;
                    break;
                case ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM_FAIL:
                    this.$$promiseComputeCrazySineSum.reject();
                    this.$$promiseComputeCrazySineSum = undefined;
                    break;
            }
        };

        ReceiveMulticoreWorker.prototype.computeCrazySineSum = function () {
            if (this.$$promiseComputeCrazySineSum) {
                throw ReceiveWorker.PREVIOUS_PROMISE_NOT_RESOLVED_YET_EXCEPTION;
            }
            this.$$promiseComputeCrazySineSum = SimplePromiseBuilder.build();
            this.$$worker.postMessage([
                ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM
            ]);

            return this.$$promiseComputeCrazySineSum;
        };

        return ReceiveMulticoreWorker;
    }

})();
