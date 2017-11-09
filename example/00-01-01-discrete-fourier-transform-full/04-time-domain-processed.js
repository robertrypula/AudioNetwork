// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function timeDomainProcessedInitialize() {
    var element, chartWidth;

    timeDomainProcessedQueue = new Queue(windowSampleSize);
    element = document.getElementById('time-domain-processed');
    chartWidth = windowSampleSize * (SAMPLE_CHART_COMPACT_BAR_WIDTH + SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH);
    timeDomainProcessedChart = new SampleChart(
        element, chartWidth, SAMPLE_CHART_COMPACT_HEIGHT, timeDomainProcessedQueue,
        SAMPLE_CHART_COMPACT_RADIUS, SAMPLE_CHART_COMPACT_BAR_WIDTH, SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH
    );
}

function timeDomainProcessedUpdate() {
    var i, chartWidth;

    timeDomainProcessedQueue.setSizeMax(windowSampleSize);
    for (i = 0; i < windowSampleSize; i++) {
        timeDomainProcessedQueue.pushEvenIfFull(
            windowFunctionQueue.getItem(i) * timeDomainRawQueue.getItem(i)
        );
    }
    chartWidth = windowSampleSize * (SAMPLE_CHART_COMPACT_BAR_WIDTH + SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH);
    timeDomainProcessedChart.setWidth(chartWidth);
}
