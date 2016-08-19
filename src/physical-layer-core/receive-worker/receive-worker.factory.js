// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
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

        ReceiveWorker = function () {
            this.$$carrierRecovery = CarrierRecoveryBuilder.build(16, 1024);
        };

        ReceiveWorker.prototype.computeCrazySineSum = function () {
            var
                promise = SimplePromiseBuilder.build(),
                result = 0;

            for (var i = 0; i < 9000111; i++) {
                result += MathUtil.sin(i);
            }
            promise.resolve(result);

            return promise;
        };

        return ReceiveWorker;
    }

})();
