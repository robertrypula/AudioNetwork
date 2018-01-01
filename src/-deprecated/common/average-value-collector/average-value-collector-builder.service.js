// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.AverageValueCollectorBuilder', _AverageValueCollectorBuilder);

    _AverageValueCollectorBuilder.$inject = [
        'Common.AverageValueCollector'
    ];

    function _AverageValueCollectorBuilder(
        AverageValueCollector
    ) {

        function build() {
            return new AverageValueCollector();
        }

        return {
            build: build
        };
    }

})();
