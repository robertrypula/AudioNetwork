// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.AnalyserChartBuilder', _AnalyserChartBuilder);

    _AnalyserChartBuilder.$inject = [
        'PhysicalLayer.AnalyserChart'
    ];

    function _AnalyserChartBuilder(
        AnalyserChart
    ) {

        function build(parentElement, analyser, height, colorData, colorAxis) {
            return new AnalyserChart(parentElement, analyser, height, colorData, colorAxis);
        }

        return {
            build: build
        };
    }

})();
