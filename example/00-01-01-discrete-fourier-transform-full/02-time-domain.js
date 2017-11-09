// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function timeDomainRawInitialize() {
    var element, chartWidth;

    timeDomainRawQueue = new Queue(windowSampleSize);
    element = document.getElementById('time-domain-raw');
    chartWidth = windowSampleSize * (SAMPLE_CHART_COMPACT_BAR_WIDTH + SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH);
    timeDomainRawChart = new SampleChart(
        element, chartWidth, SAMPLE_CHART_COMPACT_HEIGHT, timeDomainRawQueue,
        SAMPLE_CHART_COMPACT_RADIUS, SAMPLE_CHART_COMPACT_BAR_WIDTH, SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH
    );
}

function timeDomainRawUpdate() {
    var i, chartWidth, element;

    timeDomainRawQueue.setSizeMax(windowSampleSize);
    for (i = 0; i < windowSampleSize; i++) {
        timeDomainRawQueue.pushEvenIfFull(
            summedSineQueue.getItem(windowSampleOffset + i)
        );
    }
    chartWidth = windowSampleSize * (SAMPLE_CHART_COMPACT_BAR_WIDTH + SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH);
    timeDomainRawChart.setWidth(chartWidth);

    element = document.getElementById('summed-sine-visualizer-overlay');
    element.style.left = windowSampleOffset + 'px';
    element.style.width = windowSampleSize + 'px';
}
