// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.GuardPowerCollectorBuilder', _GuardPowerCollectorBuilder);

    _GuardPowerCollectorBuilder.$inject = [
        'PhysicalLayerAdapter.GuardPowerCollector'
    ];

    function _GuardPowerCollectorBuilder(
        GuardPowerCollector
    ) {

        function build() {
            return new GuardPowerCollector();
        }

        return {
            build: build
        };
    }

})();
