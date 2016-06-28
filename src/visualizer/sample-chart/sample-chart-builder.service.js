// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
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

        function build(parentElement, width, height) {
            return new SampleChart(parentElement, width, height);
        }

        return {
            build: build
        };
    }

})();
