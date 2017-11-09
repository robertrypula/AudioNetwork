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
    MONO = 1,
    MONO_INDEX = 0,
    ABSOLUTE_VALUE = true,
    NORMAL_VALUE = false,
    audioContext,
    scriptProcessorNode,
    microphone,
    microphoneVirtual,
    analyzerNode,
    animationFrameFirstCall = true,
    domSampleRate,
    domFftSize,
    domFftResolution,
    domFftBinIndexExamples,
    domLoudestFrequency,
    domGaugeRaw,
    domGaugeAnalyser,
    ctxTimeDomainDataRawSample,
    ctxTimeDomainData,
    ctxFrequencyData;

function init() {
    initDomElements();
    initWebAudioApi();

    animationFrameLoop();   // run animation loop
}

function initDomElements() {
    domSampleRate = document.getElementById('sample-rate');
    domFftSize = document.getElementById('fft-size');
    domFftResolution = document.getElementById('fft-resolution');
    domFftBinIndexExamples = document.getElementById('fft-bin-index-examples');
    domLoudestFrequency = document.getElementById('loudest-frequency');
    domGaugeRaw = document.getElementById('max-absolute-amplitude-gauge-rawsample');
    domGaugeAnalyser = document.getElementById('max-absolute-amplitude-gauge-analysernode');

    ctxFrequencyData = getConfiguredCanvasContext(
      'canvas-frequency-data',
      CANVAS_WIDTH_FREQUENCY,
      CANVAS_HEIGHT
    );
    ctxTimeDomainData = getConfiguredCanvasContext(
        'canvas-time-domain-data',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxTimeDomainDataRawSample = getConfiguredCanvasContext(
      'canvas-time-domain-data-raw-sample',
      CANVAS_WIDTH_TIME_DOMAIN_RAW_SAMPLE,
      CANVAS_HEIGHT
    );
}

function initWebAudioApi() {
    audioContext = new AudioContext();

    microphoneVirtual = audioContext.createGain();
    connectMicrophoneTo(microphoneVirtual);

    scriptProcessorNode = audioContext.createScriptProcessor(BUFFER_SIZE, MONO, MONO);
    scriptProcessorNode.onaudioprocess = function (audioProcessingEvent) {
        var monoDataIn;

        monoDataIn = audioProcessingEvent
            .inputBuffer
            .getChannelData(MONO_INDEX);

        scriptProcessorNodeHandler(monoDataIn);
    };

    analyzerNode = audioContext.createAnalyser();
    analyzerNode.fftSize = FFT_SIZE;

    microphoneVirtual.connect(scriptProcessorNode);
    microphoneVirtual.connect(analyzerNode);
    scriptProcessorNode.connect(audioContext.destination);     // it's needed because of common bug in the browsers

    domSampleRate.innerHTML = audioContext.sampleRate;
    domFftSize.innerHTML = analyzerNode.fftSize;
    domFftResolution.innerHTML = audioContext.sampleRate + ' Hz / ' + analyzerNode.fftSize + ' = ' +
        (audioContext.sampleRate / analyzerNode.fftSize).toFixed(2) + ' Hz';
}

function smoothingTimeConstantUpdate(value) {
    analyzerNode.smoothingTimeConstant = value;
}

// -----------------------------------------------------------------------
// Web Audio Api helpers

function connectMicrophoneTo(microphoneVirtual) {
    var constraints, audioConfig;

    audioConfig = {
        googEchoCancellation: false, // disabling audio processing
        googAutoGainControl: false,
        googNoiseSuppression: false,
        googHighpassFilter: false
    };
    constraints = {
        video: false,
        audio: {
            mandatory: audioConfig,
            optional: []
        }
    };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            // DO NOT declare 'microphone' variable in scope of this function
            // in some browsers it will be removed by Garbage Collector and
            // you will hear silence after few seconds
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(microphoneVirtual);
        });
}

function getFrequencyData() {
    var data;

    data = new Float32Array(analyzerNode.frequencyBinCount);   // same as: 0.5 * fftSize
    analyzerNode.getFloatFrequencyData(data);

    return data;
}

function getTimeDomainData() {
    var data;

    data = new Float32Array(analyzerNode.fftSize);
    analyzerNode.getFloatTimeDomainData(data);

    return data;
}

// -----------------------------------------------------------------------
// utils

function getMaxAbsoluteValue(data) {
    var index = getIndexOfMax(data, ABSOLUTE_VALUE);

    return Math.abs(data[index]);
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

function normalizeToUnit(value) {
    value = value > 1 ? 1 : value;
    value = value < 0 ? 0 : value;

    return value;
}

function getFrequency(fftBinIndex) {
    var resolution = audioContext.sampleRate / analyzerNode.fftSize;

    return (fftBinIndex * resolution).toFixed(2);
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

// -----------------------------------------------------------------------
// data handlers

function scriptProcessorNodeHandler(monoIn) {
    var
        monoInMaxAbsoluteSample = getMaxAbsoluteValue(monoIn),
        monoInMaxAbsoluteSampleUnit = normalizeToUnit(monoInMaxAbsoluteSample);

    domGaugeRaw.style.width = (monoInMaxAbsoluteSampleUnit * 100) + '%';
    drawTimeDomainData(ctxTimeDomainDataRawSample, monoIn);
}

function refreshDataOnScreen() {
    var
        timeDomainData = getTimeDomainData(),
        frequencyData = getFrequencyData(),
        maxAbsoluteSample = getMaxAbsoluteValue(timeDomainData),
        maxAbsoluteSampleUnit = normalizeToUnit(maxAbsoluteSample),
        frequencyDataMaxValueIndex = getIndexOfMax(frequencyData, NORMAL_VALUE),
        dbc = analyzerNode.frequencyBinCount;    // alias

    domGaugeAnalyser.style.width = (maxAbsoluteSampleUnit * 100) + '%';
    drawTimeDomainData(ctxTimeDomainData, timeDomainData);
    drawFrequencyDomainData(ctxFrequencyData, frequencyData, frequencyDataMaxValueIndex);

    domFftBinIndexExamples.innerHTML =
        '[' + 0 + '] ' + frequencyData[0].toFixed(2) + ' dB (0.00 Hz) - DC offset' + '<br/>' +
        '[' + (0.0625 * dbc) + '] ' + frequencyData[0.0625 * dbc].toFixed(2) + ' dB (' + getFrequency(0.0625 * dbc) + ' Hz)' + '<br/>' +
        '[' + (0.1250 * dbc) + '] ' + frequencyData[0.1250 * dbc].toFixed(2) + ' dB (' + getFrequency(0.1250 * dbc) + ' Hz)' + '<br/>' +
        '[' + (0.2500 * dbc) + '] ' + frequencyData[0.2500 * dbc].toFixed(2) + ' dB (' + getFrequency(0.2500 * dbc) + ' Hz)' + '<br/>' +
        '[' + (0.5000 * dbc) + '] ' + frequencyData[0.5000 * dbc].toFixed(2) + ' dB (' + getFrequency(0.5000 * dbc) + ' Hz) - middle index' + '<br/>' +
        '[' + (dbc - 1) + '] ' + frequencyData[dbc - 1].toFixed(2) + ' dB (' + getFrequency(dbc - 1) + ' Hz) - last index';


    domLoudestFrequency.innerHTML =
        '[' + frequencyDataMaxValueIndex + '] ' + frequencyData[frequencyDataMaxValueIndex].toFixed(2) + ' dB (' + getFrequency(frequencyDataMaxValueIndex) + ' Hz)';
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
