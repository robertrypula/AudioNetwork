// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function windowFunctionInitialize() {
    var element, chartWidth;

    windowFunctionQueue = new Queue(windowSampleSize);
    element = document.getElementById('window-function');
    chartWidth = windowSampleSize * (SAMPLE_CHART_COMPACT_BAR_WIDTH + SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH);
    windowFunctionChart = new SampleChart(
        element, chartWidth, SAMPLE_CHART_COMPACT_HEIGHT, windowFunctionQueue,
        SAMPLE_CHART_COMPACT_RADIUS, SAMPLE_CHART_COMPACT_BAR_WIDTH, SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH
    );
}

function windowFunctionUpdate() {
    var i, chartWidth;

    windowFunctionQueue.setSizeMax(windowSampleSize);
    for (i = 0; i < windowSampleSize; i++) {
        windowFunctionQueue.pushEvenIfFull(
            windowFunctionEnabled ? WindowFunction.blackmanNuttall(i, windowSampleSize) : 1
        );
    }
    chartWidth = windowSampleSize * (SAMPLE_CHART_COMPACT_BAR_WIDTH + SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH);
    windowFunctionChart.setWidth(chartWidth);
}
