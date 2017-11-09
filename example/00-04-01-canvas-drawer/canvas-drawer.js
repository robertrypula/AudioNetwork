// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    WINDOW_SIZE = 128,
    SAMPLE_RATE = 44100,
    CANVAS_HEIGHT = 201,
    CANVAS_WIDTH = 3 * WINDOW_SIZE,
    MAX_WIDTH = 1024,
    frequencyCalculator = new FrequencyCalculator(SAMPLE_RATE, WINDOW_SIZE),
    ctxPlot;

function init() {
    var data;

    ctxPlot = getConfiguredCanvasContext(
        'canvas-plot',
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );

    data = getData();
    data = data.concat(data, data);

    drawTimeDomainData(ctxPlot, data);
}

function getData() {
    var
        waveGenerator4 = new WaveGenerator(frequencyCalculator.getSamplePerPeriodFromCyclePerWindow(4)),
        waveGenerator5 = new WaveGenerator(frequencyCalculator.getSamplePerPeriodFromCyclePerWindow(5)),
        waveGenerator6 = new WaveGenerator(frequencyCalculator.getSamplePerPeriodFromCyclePerWindow(6)),
        waveGenerator7 = new WaveGenerator(frequencyCalculator.getSamplePerPeriodFromCyclePerWindow(7)),
        data = [],
        sample,
        i;

    waveGenerator4.setAmplitude(0.2);
    waveGenerator5.setAmplitude(0.2);
    waveGenerator6.setAmplitude(0.2);
    waveGenerator7.setAmplitude(0.2);

    waveGenerator4.setUnitPhase(0.25);
    waveGenerator6.setUnitPhase(0.75);

    for (i = 0; i < WINDOW_SIZE; i++) {
        sample = 0;

        sample += waveGenerator4.getSample();
        sample += waveGenerator5.getSample();
        sample += waveGenerator6.getSample();
        sample += waveGenerator7.getSample();

        data[i] = sample;

        waveGenerator4.nextSample();
        waveGenerator5.nextSample();
        waveGenerator6.nextSample();
        waveGenerator7.nextSample();
    }

    return data;
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
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2d4e8a';

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
