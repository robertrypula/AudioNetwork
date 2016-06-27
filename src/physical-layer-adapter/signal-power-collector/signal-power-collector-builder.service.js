// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.SignalPowerCollectorBuilder', _SignalPowerCollectorBuilder);

    _SignalPowerCollectorBuilder.$inject = [
        'PhysicalLayerAdapter.SignalPowerCollector'
    ];

    function _SignalPowerCollectorBuilder(
        SignalPowerCollector
    ) {

        function build() {
            return new SignalPowerCollector();
        }

        return {
            build: build
        };
    }

})();
