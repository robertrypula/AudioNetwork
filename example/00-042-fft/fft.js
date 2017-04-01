// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    audioMonoIO,
    LIMIT_CANVAS_WIDTH = true,
    FFT_SIZE = 1 * 1024,         // powers of 2 in range: 32, 32768
    BUFFER_SIZE = 1 * 1024,
    CANVAS_WIDTH_FREQUENCY = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -150,
    animationFrameFirstCall = true,
    ctxRxFrequencyData,
    ctxFft,
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
    ctxFft = getConfiguredCanvasContext(
        'canvas-fft',
        BUFFER_SIZE,
        CANVAS_HEIGHT
    );
}

function initWebAudioApi() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE, BUFFER_SIZE);

    audioMonoIO.setVolume(0.01);
    audioMonoIO.setSampleInHandler(sampleInHandler);

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
}

// -----------------------------------------------------------------------
// recursive DIT FFT (decimation in time)

function fft(input) {
    var
        n = input.length,
        nHalf,
        even,
        odd,
        output = [],
        wnkMultiplied,
        wnk,
        k,
        r;

    if (n === 1) {
        return input;
    }

    // even and odd parts
    even = fft(getListHalf(input, 0));
    odd = fft(getListHalf(input, 1));

    // combine
    output.length = n;
    nHalf = n / 2;
    for (k = 0; k < nHalf; k++) {
        r = -2 * Math.PI * k / n;
        wnk = getComplexFromRadians(r);
        wnkMultiplied = complexMultiply(wnk, odd[k]);
        output[k] = complexAdd(even[k], wnkMultiplied);
        output[nHalf + k] = complexSubtract(even[k], wnkMultiplied);
    }

    return output;
}

function getListHalf(list, offset) {
    var i, listHalf, item, lengthHalf;

    listHalf = [];
    lengthHalf = list.length / 2;
    for (i = 0; i < lengthHalf; i++) {
        item = list[i * 2 + offset];
        listHalf.push(item);
    }

    return listHalf;
}

function getComplexFromRadians(r) {
    return {
        real: Math.cos(r),
        imm: Math.sin(r)
    }
}

function complexMultiply(a, b) {
    return {
        real: a.real * b.real - a.imm * b.imm,
        imm: a.real * b.imm + a.imm * b.real
    };
}

function complexSubtract(a, b) {
    return {
        real: a.real - b.real,
        imm: a.imm - b.imm
    };
}

function complexAdd(a, b) {
    return {
        real: a.real + b.real,
        imm: a.imm + b.imm
    };
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
        y2 = hMaxPix * (data[x + 1] / DECIBEL_MIN);
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
    var
        i,
        complex,
        timeDomain,
        frequencyDomain,
        data,
        magnitude,
        magnitudeNormalized,
        frequencyDataMaxValueIndex;

    // convert to complex samples
    timeDomain = [];
    for (i = 0; i < monoIn.length; i++) {
        complex = {
            real: monoIn[i],
            imm: 0
        };
        timeDomain.push(complex);
    }

    // compute FFT
    frequencyDomain = fft(timeDomain);
    data = [];
    data.length = frequencyDomain.length;
    for (i = 0; i < frequencyDomain.length; i++) {
        magnitude = Math.sqrt(
            frequencyDomain[i].real * frequencyDomain[i].real +
            frequencyDomain[i].imm * frequencyDomain[i].imm
        );
        magnitudeNormalized = magnitude / frequencyDomain.length;
        data[i] = 20 * Math.log(magnitudeNormalized) / Math.LN10;
    }

    // draw FFT output
    frequencyDataMaxValueIndex = getIndexOfMax(data);
    drawFrequencyDomainData(ctxFft, data, frequencyDataMaxValueIndex);
}

function refreshDataOnScreen() {
    var
        frequencyData = audioMonoIO.getFrequencyData(),
        frequencyDataMaxValueIndex = getIndexOfMax(frequencyData);

    drawFrequencyDomainData(ctxRxFrequencyData, frequencyData, frequencyDataMaxValueIndex);
}
