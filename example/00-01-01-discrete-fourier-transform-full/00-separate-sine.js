// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function separateSineInitialize() {
    var i, carrierGenerate, queue, sampleChart, element;

    for (i = 0; i < separateSineParameter.length; i++) {
        carrierGenerate = new CarrierGenerate(separateSineParameter[i].samplePerPeriod);
        queue =  new Queue(sineSampleSize);
        element = document.getElementById('separate-sine-' + i);
        sampleChart = new SampleChart(element, sineSampleSize, SAMPLE_CHART_COMPACT_HEIGHT, queue);
        separateSineCarrierGenerate.push(carrierGenerate);
        separateSineQueue.push(queue);
        separateSineChart.push(sampleChart);
    }
}

function separateSineUpdate() {
    var i, j, carrierGenerate, queue, sampleChart;

    for (i = 0; i < separateSineParameter.length; i++) {
        carrierGenerate = separateSineCarrierGenerate[i];
        queue =  separateSineQueue[i];
        sampleChart = separateSineChart[i];

        carrierGenerate.setSamplePerPeriod(separateSineParameter[i].samplePerPeriod);
        queue.setSizeMax(sineSampleSize);
        sampleChart.setWidth(sineSampleSize);

        carrierGenerate.reset();
        carrierGenerate.addToQueue({
            amplitude: separateSineParameter[i].amplitude,
            duration: sineSampleSize,
            phase: separateSineParameter[i].phase / 360
        });

        for (j = 0; j < sineSampleSize; j++) {
            queue.pushEvenIfFull(carrierGenerate.getSample());
            carrierGenerate.nextSample();
        }
    }
}
