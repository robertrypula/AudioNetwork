// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function init() {
}

function checkWaveAnalyserPerformance() {
    var log;

    log = '';
    log += runPerformanceTest(1 * 1024) + '\n<br/>';
    log += runPerformanceTest(2 * 1024) + '\n<br/>';
    log += runPerformanceTest(4 * 1024) + '\n<br/>';
    log += runPerformanceTest(8 * 1024) + '\n<br/>';
    log += runPerformanceTest(16 * 1024) + '\n<br/>';
    log += runPerformanceTest(32 * 1024) + '\n<br/>';
    log += runPerformanceTest(64 * 1024) + '\n<br/>';

    html('#log-performance', log);
}

function runPerformanceTest(windowSize) {
    var
        SAMPLE_RATE = 48000,  // fixed for all devices
        SUBCARRIERS = 100,    // for average
        dummySamplePerPeriod,
        windowFunction,
        waveAnalyser,
        i,
        j,
        decibel,
        timeDomainData = [],
        start,
        end,
        oneSubcarrierTime,
        windowSizeDurationMs,
        subcarriersPerSecond;

    for (i = 0; i < windowSize; i++) {
        timeDomainData.push(-1 + 2 * Math.random());
    }

    start = new Date().getTime();

    dummySamplePerPeriod = 1;     // could be any other value
    windowFunction = true;
    waveAnalyser = new WaveAnalyser(dummySamplePerPeriod, windowSize, windowFunction);

    for (i = 0; i < SUBCARRIERS; i++) {
        waveAnalyser.setSamplePerPeriod(1 + i);
        for (j = 0; j < windowSize; j++) {
            waveAnalyser.handle(timeDomainData[j]);
        }
        decibel = waveAnalyser.getDecibel();
    }

    end = new Date().getTime();
    oneSubcarrierTime = (end - start) / SUBCARRIERS;

    windowSizeDurationMs = (windowSize / SAMPLE_RATE) * 1000;
    subcarriersPerSecond = windowSizeDurationMs / oneSubcarrierTime;

    return '' +
        '<b>Window size:</b> ' + windowSize + ' samples\n<br/>' +
        '<b>Window time:</b> ' + windowSizeDurationMs.toFixed(1) + ' ms\n<br/>' +
        '<b>One frequency computation time:</b> ' + oneSubcarrierTime + ' ms (' + (100 * (oneSubcarrierTime / windowSizeDurationMs)).toFixed(1) + ' % of window time)\n<br/>' +
        '<b>[estimation] Real-time frequencies:</b> ' + subcarriersPerSecond.toFixed(0) + '\n<br/>' +
        '<b>[estimation] DFT computing time:</b> ' + (0.5 * oneSubcarrierTime * windowSize / 1000).toFixed(3) + ' s\n<br/>';
}
