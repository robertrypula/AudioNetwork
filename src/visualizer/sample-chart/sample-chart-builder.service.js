// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.SampleChartBuilder', _SampleChartBuilder);

    _SampleChartBuilder.$inject = [
        'Visualizer.SampleChart'
    ];

    function _SampleChartBuilder(
        SampleChart
    ) {

        function build(parentElement, width, height, queue, radius, barWidth, barSpacingWidth, colorAxis, colorSample, colorBar) {
            return new SampleChart(parentElement, width, height, queue, radius, barWidth, barSpacingWidth, colorAxis, colorSample, colorBar);
        }

        return {
            build: build
        };
    }

})();
