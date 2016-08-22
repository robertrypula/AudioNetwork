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

        ReceiveMulticoreWorker = function (key) {
            var threadCode, blob, objectUrl;

            if (AudioNetwork.bootConfig.multicoreState === AudioNetwork.MULTICORE_STATE.DISABLED) {
                throw ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION;
            }

            threadCode = ReceiveMulticoreWorkerThread.getJavaScriptCode();
            blob = new Blob(
                [ threadCode ],
                { type: 'application/javascript' }
            );
            objectUrl = URL.createObjectURL(blob);

            this.$$key = key;
            this.$$worker = new Worker(objectUrl);
            this.$$worker.onmessage = this.$$onMessage.bind(this);

            this.$$promise = [];
            this.$$promise.length = ReceiveMulticoreWorker.MESSAGE_TOTAL;

            this.$$sendToThread(ReceiveMulticoreWorker.INITIALIZATION, this.$$key);
        };

        ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION = 'Multicore support is not enabled';
        ReceiveMulticoreWorker.PREVIOUS_PROMISE_NOT_RESOLVED_YET_EXCEPTION = 'Previous promise not resolved yet';

        ReceiveMulticoreWorker.INITIALIZATION = 0;
        ReceiveMulticoreWorker.INITIALIZATION_SUCCESS = 1;
        ReceiveMulticoreWorker.INITIALIZATION_FAIL = 2;
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM = 3;
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM_SUCCESS = 4;
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM_FAIL = 5;

        ReceiveMulticoreWorker.MESSAGE_TOTAL = 6;
        ReceiveMulticoreWorker.MESSAGE_INDEX_SPACING = 3;
        ReceiveMulticoreWorker.MESSAGE_INDEX_OFFSET_SUCCESS = 1;
        ReceiveMulticoreWorker.MESSAGE_INDEX_OFFSET_FAIL = 2;

        ReceiveMulticoreWorker.prototype.destroy = function() {
            if (this.$$worker) {
                this.$$worker.terminate();
                this.$$worker = undefined;
            }
        };

        ReceiveMulticoreWorker.prototype.getInitialization = function() {
            return this.$$promise[ReceiveMulticoreWorker.INITIALIZATION];
        };

        ReceiveMulticoreWorker.prototype.$$onMessage = function(event) {
            var
                data = event.data,
                messageIndex = data.length > 0 ? data[0] : null,
                result = data.length > 1 ? data[1] : null,
                promise,
                i;

            for (i = 0; i < this.$$promise.length; i++) {
                promise = this.$$promise[i];
                if (promise) {
                    switch (messageIndex % ReceiveMulticoreWorker.MESSAGE_INDEX_SPACING) {
                        case ReceiveMulticoreWorker.MESSAGE_INDEX_OFFSET_SUCCESS:
                            promise.resolve(result);
                            break;
                        case ReceiveMulticoreWorker.MESSAGE_INDEX_OFFSET_FAIL:
                            promise.reject(result);
                            break;
                    }
                    this.$$promise[i] = undefined;
                    break;
                }
            }
        };

        ReceiveMulticoreWorker.prototype.$$sendToThread = function (messageIndex, value) {
            if (this.$$promise[messageIndex]) {
                throw ReceiveWorker.PREVIOUS_PROMISE_NOT_RESOLVED_YET_EXCEPTION;
            }
            this.$$promise[messageIndex] = SimplePromiseBuilder.build();
            this.$$worker.postMessage([
                messageIndex,
                value
            ]);

            return this.$$promise[ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM];
        };

        ReceiveMulticoreWorker.prototype.computeCrazySineSum = function (value) {
            return this.$$sendToThread(ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM, value);
        };

        return ReceiveMulticoreWorker;
    }

})();
