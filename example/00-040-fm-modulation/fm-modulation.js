// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    audioMonoIO,
    LIMIT_CANVAS_WIDTH = true,
    FFT_SIZE = 2 * 1024,         // powers of 2 in range: 32, 32768
    BUFFER_SIZE = 1 * 1024,
    CANVAS_WIDTH_TIME_DOMAIN = BUFFER_SIZE,
    CANVAS_WIDTH_FREQUENCY = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -150,
    animationFrameFirstCall = true,
    ctxRxFrequencyData,
    ctxRxTimeDomainBaseband,
    ctxRxTimeDomainAudio,
    ctxTxTimeDomainAudio,
    ctxTxTimeDomainBaseband,
    domLoudestFrequency,
    domLoopbackCheckbox,
    sampleNumber = 0,
    carrierFrequency = 3000,
    carrierPhase = 0,
    carrierFrequencyDeviation = 100,
    basebandFrequency = 0.5;

function init() {
    initDomElement();
    initWebAudioApi();

    animationFrameLoop();   // run animation loop
}

function initDomElement() {
    domLoudestFrequency = document.getElementById('loudest-frequency');
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');

    ctxRxFrequencyData = getConfiguredCanvasContext(
        'canvas-rx-frequency-data',
        CANVAS_WIDTH_FREQUENCY,
        CANVAS_HEIGHT
    );
    ctxRxTimeDomainBaseband = getConfiguredCanvasContext(
        'canvas-rx-time-domain-baseband',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxRxTimeDomainAudio = getConfiguredCanvasContext(
        'canvas-rx-time-domain-audio',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxTxTimeDomainAudio = getConfiguredCanvasContext(
        'canvas-tx-time-domain-audio',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxTxTimeDomainBaseband = getConfiguredCanvasContext(
        'canvas-tx-time-domain-baseband',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
}

function initWebAudioApi() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE, BUFFER_SIZE);

    audioMonoIO.setVolume(0.01);
    audioMonoIO.setSampleOutHandler(sampleOutHandler);
    audioMonoIO.setSampleInHandler(sampleInHandler);

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
}

// -----------------------------------------------------------------------
// utils

function getIndexOfMax(data) {
    var i, maxIndex, max, value;

    for (i = 0; i < data.length; i++) {
        value = data[i];
        if (i === 0 || value > max) {
            max = value;
            maxIndex = i;
        }
    }

    return maxIndex;
}

function getSamplePerPeriod(frequency) {
    return audioMonoIO.getSampleRate() / frequency;
}

function generateSineWave(samplePerPeriod, amplitude, unitPhaseOffset, sample) {
    var x;

    x = 2 * Math.PI * (sample / samplePerPeriod - unitPhaseOffset);

    return amplitude * Math.sin(x);
}

function getFrequency(fftBinIndex) {
    var fftResolution = audioMonoIO.getFFTResolution();

    return (fftBinIndex * fftResolution).toFixed(2);
}

function getZeroCrossingIndex(data, startingIndex) {
    var i, zeroCrossing;

    for (i = startingIndex; i < data.length - 4; i++) {
        zeroCrossing =
            data[i + 0] < 0 &&
            data[i + 1] < 0 &&
            data[i + 2] > 0 &&
            data[i + 3] > 0;

        if (zeroCrossing) {
            return i + 2;
        }
    }

    return 0;
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

function animationFrameLoop() {
    if (!animationFrameFirstCall) {
        refreshDataOnScreen();
    } else {
        animationFrameFirstCall = false;
    }
    requestAnimationFrame(animationFrameLoop);
}

function drawTimeDomainData(ctx, data) {       // TODO add zero-crossing checking
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

function drawFrequencyDomainData(ctx, data, frequencyDataMaxValueIndex) {
    var limit, hMaxPix, x, y1, y2;

    clear(ctx);

    hMaxPix = CANVAS_HEIGHT - 1;
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMaxPix * (data[x] / DECIBEL_MIN);
        y2 = hMaxPix * (data[x  + 1] / DECIBEL_MIN);
        drawLine(ctx, x, y1, x + 1, y2);

        // mark loudest frequency
        if (x === frequencyDataMaxValueIndex) {
            drawLine(ctx, x, y1, x, hMaxPix);
        }
    }
}

// -----------------------------------------------------------------------
// data handlers

function sampleInHandler(monoIn) {
    drawTimeDomainData(ctxRxTimeDomainAudio, monoIn);
}

function sampleOutHandler(monoOut, monoIn) {
    var
        baseband = [],
        basebandSample,
        audioSample,
        phaseSpeed,
        i,
        dt;

    baseband.length = monoOut.length;
    dt = 1 / audioMonoIO.getSampleRate();

    for (i = 0; i < monoOut.length; i++) {
        basebandSample = generateSineWave(getSamplePerPeriod(basebandFrequency), 1.0, 0, sampleNumber);
        phaseSpeed = carrierFrequencyDeviation * basebandSample;    // TODO potential problem, when basebandSample will be zero it may not be zero because of accumulating rounding errors
        carrierPhase += phaseSpeed * dt;
        audioSample = generateSineWave(getSamplePerPeriod(carrierFrequency), 0.5, carrierPhase, sampleNumber);

        monoOut[i] = audioSample;
        baseband[i] = basebandSample;

        sampleNumber++;
    }

    drawTimeDomainData(ctxTxTimeDomainBaseband, baseband);
    drawTimeDomainData(ctxTxTimeDomainAudio, monoOut);
}

function refreshDataOnScreen() {
    var
        frequencyData = audioMonoIO.getFrequencyData(),
        frequencyDataMaxValueIndex = getIndexOfMax(frequencyData);

    drawFrequencyDomainData(ctxRxFrequencyData, frequencyData, frequencyDataMaxValueIndex);

    domLoudestFrequency.innerHTML =
        '[' + frequencyDataMaxValueIndex + '] ' + frequencyData[frequencyDataMaxValueIndex].toFixed(2) + ' dB (' + getFrequency(frequencyDataMaxValueIndex) + ' Hz)';
}

