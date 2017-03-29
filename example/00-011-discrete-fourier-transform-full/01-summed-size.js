// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function summedSineInitialize() {
    var element;

    summedSineQueue = new Queue(sineSampleSize);
    element = document.getElementById('summed-sine');
    summedSineChart = new SampleChart(element, sineSampleSize, SAMPLE_CHART_COMPACT_HEIGHT, summedSineQueue);

    element = document.getElementById('summed-sine-visualizer-overlay');
    element.style.height = SAMPLE_CHART_COMPACT_HEIGHT + 'px';
    element.style.top = -SAMPLE_CHART_COMPACT_HEIGHT + 'px';
}

function summedSineUpdate() {
    var i, j, sampleSum;

    summedSineQueue.setSizeMax(sineSampleSize);
    for (i = 0; i < sineSampleSize; i++) {
        sampleSum = 0;
        for (j = 0; j < separateSineQueue.length; j++) {
            sampleSum += separateSineQueue[j].getItem(i);
        }
        sampleSum += (-1 + 2 * Math.random()) * whiteNoiseAmplitude;
        summedSineQueue.pushEvenIfFull(sampleSum);
    }
    summedSineChart.setWidth(sineSampleSize);
}
