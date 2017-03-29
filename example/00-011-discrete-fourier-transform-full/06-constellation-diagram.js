// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function constellationDiagramInitialize() {
    var element;

    constellationDiagramQueue = new Queue(CONSTELLATION_DIAGRAM_POINT_HISTORY);
    element = document.getElementById('constellation-diagram');
    constellationDiagramChart = new ConstellationDiagram(
        element, CONSTELLATION_DIAGRAM_WIDTH, CONSTELLATION_DIAGRAM_HEIGHT, constellationDiagramQueue, amplitudeDecibelMin
    );
}

function constellationDiagramUpdate() {
    var frequencyBin;

    frequencyBin = frequencyBinQueue.getItem(frequencyBinToExplainIndex);
    constellationDiagramQueue.pushEvenIfFull({
        powerDecibel: frequencyBin.amplitudeDecibel,          // TODO change to amplitude !!!!!
        phase: frequencyBin.phase
    });
    constellationDiagramChart.setPowerDecibelMin(amplitudeDecibelMin);   // TODO change to amplitude !!!!!
}
