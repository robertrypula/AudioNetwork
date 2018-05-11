// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerCore.ReceiveWorker', _ReceiveWorker);

    _ReceiveWorker.$inject = [
        'Common.CarrierRecoveryBuilder',
        'Common.MathUtil',
        'Common.SimplePromiseBuilder'
    ];

    function _ReceiveWorker(
        CarrierRecoveryBuilder,
        MathUtil,
        SimplePromiseBuilder
    ) {
        var ReceiveWorker;

        ReceiveWorker = function (key) {
            this.$$key = key;
            this.$$carrierRecovery = CarrierRecoveryBuilder.build(16, 16 * 1024);
        };

        ReceiveWorker.prototype.computeCrazySineSum = function (addValue) {
            var
                promise = SimplePromiseBuilder.build(),
                result = 0;

            for (var i = 0; i < 9000111; i++) {
                result += MathUtil.sin(i);
            }
            result = addValue + MathUtil.abs(result);
            promise.resolve({
                key: this.$$key,
                result: result
            });

            return promise;
        };

        ReceiveWorker.prototype.handleSampleBlock = function (sampleBlock) {
            var
                promise = SimplePromiseBuilder.build(),
                result,
                i;

            for (i = 0; i < 16 * 1024; i++) {
                this.$$carrierRecovery.handleSample(
                    Math.sin(2 * Math.PI * (i / 16 - 0.25))
                );
            }
            result = this.$$carrierRecovery.getCarrierDetail();

            promise.resolve({
                key: this.$$key,
                result: result
            });

            return promise;
        };

        return ReceiveWorker;
    }

})();
