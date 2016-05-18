// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ConstellationDiagramBuilder', _ConstellationDiagramBuilder);

    _ConstellationDiagramBuilder.$inject = [
        'PhysicalLayer.ConstellationDiagram'
    ];

    function _ConstellationDiagramBuilder(
        ConstellationDiagram
    ) {

        function build(parentElement, queue, width, height, colorAxis, colorHistoryPoint) {
            return new ConstellationDiagram(parentElement, queue, width, height, colorAxis, colorHistoryPoint);
        }

        return {
            build: build
        };
    }

})();
