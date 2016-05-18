// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.PhaseOffsetCollectorBuilder', _PhaseOffsetCollectorBuilder);

    _PhaseOffsetCollectorBuilder.$inject = [
        'PhysicalLayer.PhaseOffsetCollector'
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
