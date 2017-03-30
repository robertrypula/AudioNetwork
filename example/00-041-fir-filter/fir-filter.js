// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    audioMonoIO,
    LIMIT_CANVAS_WIDTH = true,
    FFT_SIZE = 2 * 1024,         // powers of 2 in range: 32, 32768
    BUFFER_SIZE = 1 * 1024,
    CANVAS_WIDTH_FREQUENCY = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -150,
    animationFrameFirstCall = true,
    ctxRxFrequencyData,
    domLoopbackCheckbox;

function init() {
    initDomElement();
    initWebAudioApi();

    animationFrameLoop();   // run animation loop
}

function initDomElement() {
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');

    ctxRxFrequencyData = getConfiguredCanvasContext(
        'canvas-rx-frequency-data',
        CANVAS_WIDTH_FREQUENCY,
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

}

var lastSample = 0;

function sampleOutHandler(monoOut, monoIn) {
    var i;

    for (i = 0; i < monoOut.length; i++) {
        monoOut[i] = (-1 + Math.random() * 2) * 0.1;

        if (i >= 5) {
            monoOut[i] = monoOut[i] +
              monoOut[i - 1] +
              monoOut[i - 2] +
              monoOut[i - 3] +
              monoOut[i - 4] +
              monoOut[i - 5];

            monoOut[i] /= 5;
        } else {
            // monoOut[i] = 0.5 * monoOut[i] + 0.5 * lastSample;
        }
    }

    lastSample = monoOut[monoOut.length - 1];
}

function refreshDataOnScreen() {
    var
        frequencyData = audioMonoIO.getFrequencyData(),
        frequencyDataMaxValueIndex = getIndexOfMax(frequencyData);

    drawFrequencyDomainData(ctxRxFrequencyData, frequencyData, frequencyDataMaxValueIndex);
}

