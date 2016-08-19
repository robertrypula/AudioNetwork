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

            this.$$promiseComputeCrazySineSum = undefined;
        };

        ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION = 'Multicore support is not enabled';
        ReceiveMulticoreWorker.PREVIOUS_PROMISE_NOT_RESOLVED_YET_EXCEPTION = 'Previous promise not resolved yet';

        ReceiveMulticoreWorker.ACTION_COMPUTE_CRAZY_SINE_SUM = 'ACTION_COMPUTE_CRAZY_SINE_SUM';
        ReceiveMulticoreWorker.ACTION_COMPUTE_CRAZY_SINE_SUM_SUCCESS = 'ACTION_COMPUTE_CRAZY_SINE_SUM_SUCCESS';
        ReceiveMulticoreWorker.ACTION_COMPUTE_CRAZY_SINE_SUM_FAIL = 'ACTION_COMPUTE_CRAZY_SINE_SUM_FAIL';

        ReceiveMulticoreWorker.prototype.destroy = function() {
            if (this.$$worker) {
                this.$$worker.terminate();
                this.$$worker = undefined;
            }
        };

        ReceiveMulticoreWorker.prototype.$$onMessage = function(event) {
            var
                data = event.data,
                action = data.length > 0 ? data[0] : null,
                result = data.length > 1 ? data[1] : null;

            switch (action) {
                case ReceiveMulticoreWorker.ACTION_COMPUTE_CRAZY_SINE_SUM_SUCCESS:
                    this.$$promiseComputeCrazySineSum.resolve(result);
                    this.$$promiseComputeCrazySineSum = undefined;
                    break;
                case ReceiveMulticoreWorker.ACTION_COMPUTE_CRAZY_SINE_SUM_FAIL:
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
                ReceiveMulticoreWorker.ACTION_COMPUTE_CRAZY_SINE_SUM
            ]);

            return this.$$promiseComputeCrazySineSum;
        };

        return ReceiveMulticoreWorker;
    }

})();
