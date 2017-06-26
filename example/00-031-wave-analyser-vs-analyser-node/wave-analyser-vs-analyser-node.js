// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE = 2048,
    LIMIT_CANVAS_WIDTH = false,
    CANVAS_WIDTH_TIME_DOMAIN = FFT_SIZE,
    CANVAS_WIDTH_FREQUENCY_DOMAIN = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -150,
    audioMonoIO,
    ctxTimeDomain,
    ctxAnalyserNode,
    ctxWaveAnalyser;

function init() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE);

    ctxTimeDomain = getConfiguredCanvasContext(
        'canvas-time-domain',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxAnalyserNode = getConfiguredCanvasContext(
        'canvas-analyser-node',
        CANVAS_WIDTH_FREQUENCY_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxWaveAnalyser = getConfiguredCanvasContext(
        'canvas-wave-analyser',
        CANVAS_WIDTH_FREQUENCY_DOMAIN,
        CANVAS_HEIGHT
    );
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

function compareWithAnalyserNode() {
    var
        timeDomainData = audioMonoIO.getTimeDomainData(),
        frequencyDataAnalyserNode = audioMonoIO.getFrequencyData(),
        frequencyDataWaveAnalyser,
        start,
        end,
        time;

    start = new Date().getTime();
    frequencyDataWaveAnalyser = getDiscreteFourierTransform(timeDomainData);
    end = new Date().getTime();
    time = end - start;
    alert('Execution time: ' + time + ' ms');

    drawTimeDomainData(ctxTimeDomain, timeDomainData);
    drawFrequencyDomainData(ctxAnalyserNode, frequencyDataAnalyserNode);
    drawFrequencyDomainData(ctxWaveAnalyser, frequencyDataWaveAnalyser);
}

function getDiscreteFourierTransform(timeDomainData) {
    var
        dummySamplePerPeriod = 1,     // just for initialization
        windowSize = timeDomainData.length,
        windowFunction = true,
        waveAnalyser = new WaveAnalyser(dummySamplePerPeriod, windowSize, windowFunction),
        frequencyData = [],
        i,
        N = timeDomainData.length,
        samplePerPeriod,
        k;

    for (i = 0; i < timeDomainData.length; i++) {
        waveAnalyser.handle(timeDomainData[i]);
    }

    for (k = 0; k < 0.5 * N; k++) {
        samplePerPeriod = (k === 0)
            ? Infinity               // DC-offset
            : N / k;
        waveAnalyser.setSamplePerPeriod(samplePerPeriod);
        frequencyData.push(
            waveAnalyser.getDecibel()
        );
    }

    return frequencyData;
}

// -----------------------------------------------------------------------
// animation, canvas 2d context

function clear(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.stroke();
}

function getConfiguredCanvasContext(elementId, width, height) {
    var element, ctx;

    element = document.getElementById(elementId);
    element.width = Math.min(MAX_WIDTH, width);
    element.height = height;
    ctx = element.getContext('2d');
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';

    return ctx;
}

function drawTimeDomainData(ctx, data) {
    var limit, hMid, x, y1, y2;

    clear(ctx);

    hMid = Math.floor(0.5 * CANVAS_HEIGHT);
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMid * (1 - data[x]);
        y2 = hMid * (1 - data[x + 1]);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}

function drawFrequencyDomainData(ctx, data) {
    var limit, hMaxPix, x, y1, y2;

    clear(ctx);

    hMaxPix = CANVAS_HEIGHT - 1;
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMaxPix * (data[x] / DECIBEL_MIN);
        y2 = hMaxPix * (data[x + 1] / DECIBEL_MIN);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}
