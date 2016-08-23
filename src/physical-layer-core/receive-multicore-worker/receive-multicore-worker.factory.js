// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerCore.ReceiveMulticoreWorker', _ReceiveMulticoreWorker);

    _ReceiveMulticoreWorker.$inject = [
        'PhysicalLayerCore.ReceiveMulticoreWorkerThread',
        'Common.AbstractWorker'
    ];

    function _ReceiveMulticoreWorker(
        ReceiveMulticoreWorkerThread,
        AbstractWorker
    ) {
        var ReceiveMulticoreWorker;

        ReceiveMulticoreWorker = function (key) {
            if (AudioNetwork.bootConfig.multicoreState === AudioNetwork.MULTICORE_STATE.DISABLED) {
                throw ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION;
            }

            AbstractWorker.call(this, key);
            this.$$promise.length = ReceiveMulticoreWorker.MESSAGE_TOTAL;
            this.$$sendToThread(ReceiveMulticoreWorker.INITIALIZATION, this.$$key);
        };

        ReceiveMulticoreWorker.prototype = Object.create(AbstractWorker.prototype);
        ReceiveMulticoreWorker.prototype.constructor = ReceiveMulticoreWorker;

        // abstract class messages continuation:
        ReceiveMulticoreWorker.HANDLE_SAMPLE_BLOCK = 3;
        ReceiveMulticoreWorker.HANDLE_SAMPLE_BLOCK_SUCCESS = 4;
        ReceiveMulticoreWorker.HANDLE_SAMPLE_BLOCK_FAIL = 5;
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM = 6;
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM_SUCCESS = 7;
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM_FAIL = 8;

        ReceiveMulticoreWorker.MESSAGE_TOTAL = 9;      // total messages size

        ReceiveMulticoreWorker.prototype.$$getJavaScriptCode = function() {
            return ReceiveMulticoreWorkerThread.getJavaScriptCode();
        };

        ReceiveMulticoreWorker.prototype.computeCrazySineSum = function (value) {
            return this.$$sendToThread(ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM, value);
        };

        ReceiveMulticoreWorker.prototype.handleSampleBlock = function (value) {
            return this.$$sendToThread(ReceiveMulticoreWorker.HANDLE_SAMPLE_BLOCK, value);
        };

        return ReceiveMulticoreWorker;
    }

})();
