// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    LIMIT_CANVAS_WIDTH = true,
    FFT_SIZE = 2 * 1024,         // powers of 2 in range: 32, 32768
    BUFFER_SIZE = 16 * 1024,
    CANVAS_WIDTH_TIME_DOMAIN = BUFFER_SIZE,
    CANVAS_WIDTH_FREQUENCY = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -150,
    ABSOLUTE_VALUE = true,
    NORMAL_VALUE = false,
    INITIAL_FREQUENCY = 500,
    INITIAL_VOLUME = 0.1,
    INITIAL_PHASE = 0,
    INITIAL_HARMONIC_AMPLITUDE = undefined,
    INITIAL_HARMONIC_PHASE = undefined,
    animationFrameFirstCall = true,
    domLoudestFrequency,
    domSyncCheckbox,
    domLoopbackCheckbox,
    ctxFrequencyData,
    ctxTimeDomain,
    audioMonoIO,
    txFrequency = INITIAL_FREQUENCY,
    txVolume = INITIAL_VOLUME,
    txPhase = INITIAL_PHASE,
    txHarmonicAmplitude = INITIAL_HARMONIC_AMPLITUDE,
    txHarmonicPhase = INITIAL_HARMONIC_PHASE,
    sampleGlobalCounter = 0,
    syncFrequency = INITIAL_FREQUENCY;

function init() {
    initDomElements();
    initWebAudioApi();

    animationFrameLoop();   // run animation loop
}

function initDomElements() {
    domLoudestFrequency = document.getElementById('loudest-frequency');
    domSyncCheckbox = document.getElementById('sync-checkbox');
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');

    ctxFrequencyData = getConfiguredCanvasContext(
        'canvas-frequency-data',
        CANVAS_WIDTH_FREQUENCY,
        CANVAS_HEIGHT
    );
    ctxTimeDomain = getConfiguredCanvasContext(
        'canvas-time-domain',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
}

function initWebAudioApi() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE, BUFFER_SIZE);
    audioMonoIO.setSampleInHandler(function (monoDataIn) {
        scriptProcessorNodeHandler(monoDataIn);
    });
    onLoopbackCheckboxChange();
    updateOutputWave();
}

function onLoopbackCheckboxChange() {
    audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
}

// -----------------------------------------------------------------------
// output wave stuff

function loadPredefinedWaveType(type) {
    switch (type) {
        case 'square':
            loadSquareWave();
            break;
        case 'sawtooth':
            loadSawtoothWave();
            break;
        case 'triangle':
            loadTriangleWave();
            break;
        case 'piano':
            loadPianoWave();
            break;
        case 'violin':
            loadViolinWave();
            break;
        default:
            txHarmonicAmplitude = INITIAL_HARMONIC_AMPLITUDE;
            txHarmonicPhase = INITIAL_HARMONIC_PHASE;
    }
    updateOutputWave();
}

function loadSquareWave() {
    txHarmonicAmplitude = [
        1/1, 0/1, 1/3, 0/1, 1/5, 0/1, 1/7, 0/1, 1/9, 0/1, 1/11, 0/1, 1/13, 0/1, 1/15
    ];
    txHarmonicPhase = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];
    /*
     _amp = 0.8,
     _phase = 60,
     _spp = 120,
     separateSineParameter = [
     { amplitude: _amp/1, samplePerPeriod: _spp/1, phase: 1 * _phase },
     { amplitude: 0.0/2, samplePerPeriod: _spp/2, phase: 2 * _phase },
     { amplitude: _amp/3, samplePerPeriod: _spp/3, phase: 3 * _phase },
     { amplitude: 0.0/4, samplePerPeriod: _spp/4, phase: 4 * _phase },
     { amplitude: _amp/5, samplePerPeriod: _spp/5, phase: 5 * _phase },
     { amplitude: 0.0/6, samplePerPeriod: _spp/6, phase: 6 * _phase },
     { amplitude: _amp/7, samplePerPeriod: _spp/7, phase: 7 * _phase },
     { amplitude: 0.0/8, samplePerPeriod: _spp/8, phase: 8 * _phase },
     { amplitude: _amp/9, samplePerPeriod: _spp/9, phase: 9 * _phase },
     { amplitude: 0.0/10, samplePerPeriod: _spp/10, phase: 10 * _phase },
     { amplitude: _amp/11, samplePerPeriod: _spp/11, phase: 11 * _phase }
     ],
     */
}

function loadSawtoothWave() {
    txHarmonicAmplitude = [
        1
    ];
    txHarmonicPhase = [
        0
    ];
    /*
     // sawtooth START
     _amp = 2 * 0.8 / Math.PI,
     _phase = 0,
     _spp = 120,
     separateSineParameter = [
     { amplitude: _amp * Math.pow(-1, 1) / 1, samplePerPeriod: _spp/1, phase: 1 * _phase },
     { amplitude: _amp * Math.pow(-1, 2) / 2, samplePerPeriod: _spp/2, phase: 2 * _phase },
     { amplitude: _amp * Math.pow(-1, 3) / 3, samplePerPeriod: _spp/3, phase: 3 * _phase },
     { amplitude: _amp * Math.pow(-1, 4) / 4, samplePerPeriod: _spp/4, phase: 4 * _phase },
     { amplitude: _amp * Math.pow(-1, 5) / 5, samplePerPeriod: _spp/5, phase: 5 * _phase },
     { amplitude: _amp * Math.pow(-1, 6) / 6, samplePerPeriod: _spp/6, phase: 6 * _phase },
     { amplitude: _amp * Math.pow(-1, 7) / 7, samplePerPeriod: _spp/7, phase: 7 * _phase },
     { amplitude: _amp * Math.pow(-1, 8) / 8, samplePerPeriod: _spp/8, phase: 8 * _phase },
     { amplitude: _amp * Math.pow(-1, 9) / 9, samplePerPeriod: _spp/9, phase: 9 * _phase },
     { amplitude: _amp * Math.pow(-1, 10) / 10, samplePerPeriod: _spp/10, phase: 10 * _phase },
     { amplitude: _amp * Math.pow(-1, 11) / 11, samplePerPeriod: _spp/11, phase: 11 * _phase }
     ],
     // sawtooth END
     */
}

function loadTriangleWave() {
    txHarmonicAmplitude = [
        1
    ];
    txHarmonicPhase = [
        0
    ];
    /*
     // triangle START
     _amp = 8 / (Math.PI * Math.PI),
     _phase = 0,
     _spp = 120,
     separateSineParameter = [
     { amplitude: _amp * Math.pow(-1, 0) / Math.pow(2 * 0 + 1, 2), samplePerPeriod: _spp/1, phase: 1 * _phase },
     { amplitude: 0, samplePerPeriod: _spp/2, phase: 2 * _phase },
     { amplitude: _amp * Math.pow(-1, 1) / Math.pow(2 * 1 + 1, 2), samplePerPeriod: _spp/3, phase: 3 * _phase },
     { amplitude: 0, samplePerPeriod: _spp/4, phase: 4 * _phase },
     { amplitude: _amp * Math.pow(-1, 2) / Math.pow(2 * 2 + 1, 2), samplePerPeriod: _spp/5, phase: 5 * _phase },
     { amplitude: 0, samplePerPeriod: _spp/6, phase: 6 * _phase },
     { amplitude: _amp * Math.pow(-1, 3) / Math.pow(2 * 3 + 1, 2), samplePerPeriod: _spp/7, phase: 7 * _phase },
     { amplitude: 0, samplePerPeriod: _spp/8, phase: 8 * _phase },
     { amplitude: _amp * Math.pow(-1, 4) / Math.pow(2 * 4 + 1, 2), samplePerPeriod: _spp/9, phase: 9 * _phase },
     { amplitude: 0, samplePerPeriod: _spp/10, phase: 10 * _phase },
     { amplitude: _amp * Math.pow(-1, 5) / Math.pow(2 * 5 + 1, 2), samplePerPeriod: _spp/11, phase: 11 * _phase }
     ],
     // triangle END
     */
}

function loadPianoWave() {
    txHarmonicAmplitude = [
        1
    ];
    txHarmonicPhase = [
        0
    ];
}

function loadViolinWave() {
    txHarmonicAmplitude = [
        1
    ];
    txHarmonicPhase = [
        0
    ];
}

function updateOutputWave() {
    audioMonoIO.setPeriodicWave(
        txFrequency,
        txVolume,
        txPhase,
        txHarmonicAmplitude,
        txHarmonicPhase
    );
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
    syncFrequency = frequency;
    updateOutputWave();
}

// -----------------------------------------------------------------------
// utils

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

function getFrequency(fftBinIndex) {
    var fftResolution = audioMonoIO.getFFTResolution();

    return (fftBinIndex * fftResolution).toFixed(2);
}

function getSamplePerPeriod(frequency) {
    return audioMonoIO.getSampleRate() / frequency;
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
    ctx.strokeStyle = '#eee';

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

// -----------------------------------------------------------------------
// data handlers

function scriptProcessorNodeHandler(monoIn) {
    drawTimeDomainData(ctxTimeDomain, monoIn);

    sampleGlobalCounter += monoIn.length;
}

function refreshDataOnScreen() {
    var
        frequencyData = audioMonoIO.getFrequencyData(),
        frequencyDataMaxValueIndex = getIndexOfMax(frequencyData, NORMAL_VALUE);

    drawFrequencyDomainData(ctxFrequencyData, frequencyData, frequencyDataMaxValueIndex);

    domLoudestFrequency.innerHTML =
        '[' + frequencyDataMaxValueIndex + '] ' + frequencyData[frequencyDataMaxValueIndex].toFixed(2) + ' dB (' + getFrequency(frequencyDataMaxValueIndex) + ' Hz)';
}

function drawTimeDomainData(ctx, data) {
    var
        limit,
        hMid,
        syncSamplePerPeriod,
        firstZeroCrossingIndex,
        index,
        x,
        y1,
        y2;

    clear(ctx);

    hMid = Math.floor(0.5 * CANVAS_HEIGHT);

    if (domSyncCheckbox.checked) {
        syncSamplePerPeriod = getSamplePerPeriod(syncFrequency);
        console.log(syncSamplePerPeriod, sampleGlobalCounter);
        firstZeroCrossingIndex = Math.round(sampleGlobalCounter % syncSamplePerPeriod);
    } else {
        firstZeroCrossingIndex = 0;
    }

    limit = Math.min(MAX_WIDTH, data.length) - 1 - firstZeroCrossingIndex;
    for (x = 0; x < limit; x++) {
        index = x + firstZeroCrossingIndex;
        y1 = hMid * (1 - data[index]);
        y2 = hMid * (1 - data[index + 1]);
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
