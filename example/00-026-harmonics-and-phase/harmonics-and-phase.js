// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    LIMIT_CANVAS_WIDTH = false,
    FFT_SIZE = 1 * 1024,         // powers of 2 in range: 32, 32768
    BUFFER_SIZE = 8 * 1024,
    CANVAS_WIDTH = FFT_SIZE,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 200 : Number.POSITIVE_INFINITY,
    audioMonoIO,
    ctxTimeDomainData,
    sampleGlobalCounter = 0,
    samplePerPeriodSynchronization = 89.9,
    txFrequency,
    txPhase,
    txVolume,
    txHarmonicAmplitude,
    txHarmonicPhase;

function init() {
    txFrequency = 500;
    txVolume = 0.1;
    txPhase = 0;
    txHarmonicAmplitude = undefined;

    ctxTimeDomainData = getConfiguredCanvasContext('canvas-time-domain-data', CANVAS_WIDTH, CANVAS_HEIGHT);

    audioMonoIO = new AudioMonoIO(FFT_SIZE, BUFFER_SIZE);
    audioMonoIO.setSampleInHandler(function (monoDataIn) {
        drawTimeDomainData(ctxTimeDomainData, monoDataIn);
    });
    audioMonoIO.setLoopback(true); // TODO remove it
    audioMonoIO.setVolume(0); // TODO remove it

    updateOutputWave();       // TODO remove it
}

function updateOutputWave() {
    // TODO remove it
    txHarmonicAmplitude = [ 1.0, 0.5, 0.4 ];
    txHarmonicPhase = [ 0.1, 0.6, 0.5 ];
    // ----------

    audioMonoIO.setPeriodicWave(
        txFrequency,
        txVolume,
        txPhase,
        txHarmonicAmplitude,
        txHarmonicPhase
    );
}

function harmonicAmplitudeChange(type) {
    switch (type) {
        case 'sine':
            txHarmonicAmplitude = undefined;
            break;
        case 'square':
            txHarmonicAmplitude = getSquareHarmonicAmplitude();
            break;
        default:
            txHarmonicAmplitude = undefined;
    }
    updateOutputWave();
}

function getSquareHarmonicAmplitude() {
    return [
        1/1, 0/1, 1/3, 0/1, 1/5, 0/1, 1/7, 0/1, 1/9, 0/1, 1/11, 0/1, 1/13, 0/1, 1/15
    ];
}

function volumeChange(volume) {
    txVolume = volume;
    updateOutputWave();
}

function phaseChange(phase) {
    txPhase = phase;
    updateOutputWave();
}

function frequencyChange(frequency) {
    txFrequency = frequency;
    updateOutputWave();
}

function getConfiguredCanvasContext(elementId, width, height) {
    var element, ctx;

    element = document.getElementById(elementId);
    element.width = Math.min(MAX_WIDTH, width);
    element.height = height;
    ctx = element.getContext('2d');
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#dadada';

    return ctx;
}

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.stroke();
}

function getZeroCrossingIndex(data, startingIndex) { // TODO positive zero crossing
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

function drawTimeDomainData(ctx, data) {
    var
        firstZeroCrossingIndex,
        limit,
        hMid,
        x,
        index,
        y1,
        y2;

    /*
    var a, b;

    a = getZeroCrossingIndex(data, 0);
    b = getZeroCrossingIndex(data, a);
    console.log(b - a);
    */

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    hMid = Math.floor(0.5 * CANVAS_HEIGHT);
    firstZeroCrossingIndex = Math.round(sampleGlobalCounter % samplePerPeriodSynchronization);
    limit = Math.min(MAX_WIDTH, data.length) - 1 - firstZeroCrossingIndex;
    for (x = 0; x < limit; x++) {
        index = x + firstZeroCrossingIndex;
        y1 = hMid * (1 - data[index]);
        y2 = hMid * (1 - data[index + 1]);
        drawLine(ctx, x, y1, x + 1, y2);
    }

    sampleGlobalCounter += data.length;
}
