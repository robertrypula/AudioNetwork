// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.PhaseOffsetCollectorBuilder', _PhaseOffsetCollectorBuilder);

    _PhaseOffsetCollectorBuilder.$inject = [
        'PhysicalLayerAdapter.PhaseOffsetCollector'
    ];

    function _PhaseOffsetCollectorBuilder(
        PhaseOffsetCollector
    ) {

        function build() {
            return new PhaseOffsetCollector();
        }

        return {
            build: build
        };
    }

})();
