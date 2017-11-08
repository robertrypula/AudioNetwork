// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SKIP_FACTOR = 64,
    FFT_SIZE = 8192,
    LIMIT_CANVAS_WIDTH = false,
    CANVAS_WIDTH_TIME_DOMAIN = FFT_SIZE,
    CANVAS_WIDTH_FREQUENCY_DOMAIN = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 301,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -160,
    audioMonoIO,
    ctxTimeDomain,
    ctxFrequencyDomain;

function init() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE);

    audioMonoIO.setLoopback(true);

    ctxTimeDomain = getConfiguredCanvasContext(
        'canvas-time-domain',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxFrequencyDomain = getConfiguredCanvasContext(
        'canvas-frequency-domain',
        CANVAS_WIDTH_FREQUENCY_DOMAIN,
        CANVAS_HEIGHT
    );
}

function getTransmitFrequency() {
    return FFT_SKIP_FACTOR * getFormFieldValue('#tx-sample-rate', 'int') / FFT_SIZE;
}

function setTone() {
    var
        p0 = getFormFieldValue('#sub-carrier-0', 'int') / 360, a0 = p0 < 0 ? 0 : 1,
        p1 = getFormFieldValue('#sub-carrier-1', 'int') / 360, a1 = p1 < 0 ? 0 : 1,
        p2 = getFormFieldValue('#sub-carrier-2', 'int') / 360, a2 = p2 < 0 ? 0 : 1,
        p3 = getFormFieldValue('#sub-carrier-3', 'int') / 360, a3 = p3 < 0 ? 0 : 1,
        p4 = getFormFieldValue('#sub-carrier-4', 'int') / 360, a4 = p4 < 0 ? 0 : 1,
        p5 = getFormFieldValue('#sub-carrier-5', 'int') / 360, a5 = p5 < 0 ? 0 : 1,
        p6 = getFormFieldValue('#sub-carrier-6', 'int') / 360, a6 = p6 < 0 ? 0 : 1,
        p7 = getFormFieldValue('#sub-carrier-7', 'int') / 360, a7 = p7 < 0 ? 0 : 1,
        p8 = getFormFieldValue('#sub-carrier-8', 'int') / 360, a8 = p8 < 0 ? 0 : 1,
        p9 = getFormFieldValue('#sub-carrier-9', 'int') / 360, a9 = p9 < 0 ? 0 : 1;

    audioMonoIO.setPeriodicWave(
        getTransmitFrequency(),
        1,
        0,
        [0, 0, 0, 0, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9],
        [0, 0, 0, 0, p0, p1, p2, p3, p4, p5, p6, p7, p8, p9]
    //   1  2  3  4   5   6   7   8   9  10  11  12  13  14
    );
}

function txStartUpdate() {
    setTone();
}

function txStop() {
    audioMonoIO.setPeriodicWave(0);
}


function analyse() {
    var
        timeDomainData,
        frequencyData,
        start,
        end,
        time;

    timeDomainData = audioMonoIO.getTimeDomainData();

    start = new Date().getTime();
    frequencyData = getFrequencyData(timeDomainData);
    end = new Date().getTime();
    time = end - start;
    alert('Execution time (standard DFT): ' + time + ' ms');

    drawTimeDomainData(ctxTimeDomain, timeDomainData);
    drawFrequencyDomainData(ctxFrequencyDomain, frequencyData);
}

function getFrequencyData(timeDomainData) {
    var
        dummySamplePerPeriod = 1,   // just for initialization
        windowSize = timeDomainData.length,
        frequencyBinCount = 0.5 * windowSize,
        windowFunction = true,
        waveAnalyser = new WaveAnalyser(dummySamplePerPeriod, windowSize, windowFunction),
        N = timeDomainData.length,
        frequencyData = [],
        samplePerPeriod,
        decibel,
        i,
        k;

    for (i = 0; i < timeDomainData.length; i++) {
        waveAnalyser.handle(timeDomainData[i]);
    }

    for (k = 0; k < frequencyBinCount; k++) {
        samplePerPeriod = (k === 0)
            ? Infinity       // DC-offset (0 Hz)
            : N / k;
        waveAnalyser.setSamplePerPeriod(samplePerPeriod);
        decibel = waveAnalyser.getDecibel();
        frequencyData.push(decibel);
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

function changeColor(ctx, color) {
    ctx.strokeStyle = color;
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

function drawTimeDomainData(ctx, data, doNotClear) {
    var limit, hMid, x, y1, y2;

    if (!doNotClear) {
        clear(ctx);
    }

    hMid = Math.floor(0.5 * CANVAS_HEIGHT);
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMid * (1 - data[x]);
        y2 = hMid * (1 - data[x + 1]);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}

function drawFrequencyDomainData(ctx, data, doNotClear) {
    var limit, hMaxPix, x, y1, y2;

    if (!doNotClear) {
        clear(ctx);
    }

    hMaxPix = CANVAS_HEIGHT - 1;
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMaxPix * (data[x] / DECIBEL_MIN);
        y2 = hMaxPix * (data[x + 1] / DECIBEL_MIN);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}
