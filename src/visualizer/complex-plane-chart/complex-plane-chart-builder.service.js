// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.ComplexPlaneChartBuilder', _ComplexPlaneChartBuilder);

    _ComplexPlaneChartBuilder.$inject = [
        'Visualizer.ComplexPlaneChart'
    ];

    function _ComplexPlaneChartBuilder(
        ComplexPlaneChart
    ) {

        function build(parentElement, width, height, queue, maxValue, colorAxis, colorPowerLine) {
            return new ComplexPlaneChart(parentElement, width, height, queue, maxValue, colorAxis, colorPowerLine);
        }

        return {
            build: build
        };
    }

})();
