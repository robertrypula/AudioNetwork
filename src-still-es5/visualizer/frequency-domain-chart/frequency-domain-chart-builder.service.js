// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.FrequencyDomainChartBuilder', _FrequencyDomainChartBuilder);

    _FrequencyDomainChartBuilder.$inject = [
        'Visualizer.FrequencyDomainChart'
    ];

    function _FrequencyDomainChartBuilder(
        FrequencyDomainChart
    ) {

        function build(parentElement, width, height, frequencyDomain, powerDecibelMin, radius, barWidth, barSpacingWidth, colorAxis, colorSample) {
            return new FrequencyDomainChart(parentElement, width, height, frequencyDomain, powerDecibelMin, radius, barWidth, barSpacingWidth, colorAxis, colorSample);
        }

        return {
            build: build
        };
    }

})();
