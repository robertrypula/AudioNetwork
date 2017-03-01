// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.ConstellationDiagramBuilder', _ConstellationDiagramBuilder);

    _ConstellationDiagramBuilder.$inject = [
        'Visualizer.ConstellationDiagram'
    ];

    function _ConstellationDiagramBuilder(
        ConstellationDiagram
    ) {

        function build(parentElement, width, height, queue, powerDecibelMin, colorAxis, colorHistoryPoint, colorPowerLine, radius, radiusMain) {
            return new ConstellationDiagram(parentElement, width, height, queue, powerDecibelMin, colorAxis, colorHistoryPoint, colorPowerLine, radius, radiusMain);
        }

        return {
            build: build
        };
    }

})();
