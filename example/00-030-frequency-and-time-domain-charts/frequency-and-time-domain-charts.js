// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    LIMIT_CANVAS_WIDTH = true,
    FFT_SIZE = 1 * 1024,         // powers of 2 in range: 32, 32768
    BUFFER_SIZE = 1 * 1024,
    CANVAS_WIDTH_TIME_DOMAIN = FFT_SIZE,
    CANVAS_WIDTH_TIME_DOMAIN_RAW_SAMPLE = BUFFER_SIZE,
    CANVAS_WIDTH_FREQUENCY = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -150,
    audioMonoIO,
    animationFrameFirstCall = true,
    domGaugeRaw,
    domGaugeAnalyser,
    ctxTimeDomainDataRawSample,
    ctxTimeDomainData,
    ctxFrequencyData;

function init() {
    domGaugeRaw = document.getElementById('max-absolute-amplitude-gauge-rawsample');
    domGaugeAnalyser = document.getElementById('max-absolute-amplitude-gauge-analysernode');

    ctxTimeDomainDataRawSample = getConfiguredCanvasContext('canvas-time-domain-data-raw-sample', CANVAS_WIDTH_TIME_DOMAIN_RAW_SAMPLE, CANVAS_HEIGHT);
    ctxTimeDomainData = getConfiguredCanvasContext('canvas-time-domain-data', CANVAS_WIDTH_TIME_DOMAIN, CANVAS_HEIGHT);
    ctxFrequencyData = getConfiguredCanvasContext('canvas-frequency-data', CANVAS_WIDTH_FREQUENCY, CANVAS_HEIGHT);

    audioMonoIO = new AudioMonoIO(FFT_SIZE, BUFFER_SIZE);

    // square wave test
    /*
    audioMonoIO.setLoopback(true);
    audioMonoIO.setPeriodicWave(3000, 0.3, 0.0, [ 1/1, 0, 1/3, 0, 1/5 ], [ 0, 0, 0, 0, 0 ]);
    audioMonoIO.setSampleOutHandler(function (monoOut) {
        for (var i = 0; i < monoOut.length; i++) {
            monoOut[i] = 0.05 * (Math.random() * 2 - 1);    // white noise
        }
    });
    */
    // --------------

    audioMonoIO.setSampleInHandler(function (monoIn) {
        domGaugeRaw.style.width = (monoIn[getIndexOfMax(monoIn, true)] * 100) + '%';
        drawTimeDomainData(ctxTimeDomainDataRawSample, monoIn);
    });

    animationFrameLoop();
}

function getIndexOfMax(data, absoluteValue) {
    var i, maxIndex, max, value;

    for (i = 0; i < data.length; i++) {
        value = absoluteValue ? Math.abs(data[i]) : data[i];
        if (i === 0 || value > max) {
            max = value;
            maxIndex = i;
        }
    }

    return maxIndex;
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

function animationFrameLoop() {
    if (!animationFrameFirstCall) {
        draw();
    } else {
        animationFrameFirstCall = false;
    }
    requestAnimationFrame(animationFrameLoop);
}

function draw() {
    var
        timeDomainData = audioMonoIO.getTimeDomainData(),
        frequencyData = audioMonoIO.getFrequencyData();

    domGaugeAnalyser.style.width = (timeDomainData[getIndexOfMax(timeDomainData, true)] * 100) + '%';
    drawTimeDomainData(ctxTimeDomainData, timeDomainData);
    drawFrequencyDomainData(ctxFrequencyData, frequencyData)
}

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
        y2 = hMaxPix * (data[x  + 1] / DECIBEL_MIN);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}
