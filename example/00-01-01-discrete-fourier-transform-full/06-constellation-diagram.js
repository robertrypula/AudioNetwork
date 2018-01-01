// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function constellationDiagramInitialize() {
    var element;

    constellationDiagramQueue = new Queue(CONSTELLATION_DIAGRAM_POINT_HISTORY);
    element = document.getElementById('constellation-diagram');
    constellationDiagramChart = new ConstellationDiagram(
        element, CONSTELLATION_DIAGRAM_WIDTH, CONSTELLATION_DIAGRAM_HEIGHT, constellationDiagramQueue, dBMin
    );
}

function constellationDiagramUpdate() {
    var frequencyBin;

    frequencyBin = frequencyBinQueue.getItem(frequencyBinToExplainIndex);
    constellationDiagramQueue.pushEvenIfFull({
        powerDecibel: frequencyBin.dB,
        phase: frequencyBin.phase
    });
    constellationDiagramChart.setPowerDecibelMin(dBMin);
}
