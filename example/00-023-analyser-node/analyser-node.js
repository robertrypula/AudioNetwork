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
    FFT_SMOOTHING_DISABLED = 0,
    audioContext,
    scriptProcessorNode,
    microphone,
    microphoneVirtual,
    analyzerNode,
    animationFrameFirstCall = true,
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
    domGaugeRaw = document.getElementById('max-absolute-amplitude-gauge-rawsample');
    domGaugeAnalyser = document.getElementById('max-absolute-amplitude-gauge-analysernode');

    ctxTimeDomainDataRawSample = getConfiguredCanvasContext(
        'canvas-time-domain-data-raw-sample',
        CANVAS_WIDTH_TIME_DOMAIN_RAW_SAMPLE,
        CANVAS_HEIGHT
    );
    ctxTimeDomainData = getConfiguredCanvasContext(
        'canvas-time-domain-data',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxFrequencyData = getConfiguredCanvasContext(
        'canvas-frequency-data',
        CANVAS_WIDTH_FREQUENCY,
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
    analyzerNode.smoothingTimeConstant = FFT_SMOOTHING_DISABLED;

    microphoneVirtual.connect(scriptProcessorNode);
    microphoneVirtual.connect(analyzerNode);
    scriptProcessorNode.connect(audioContext.destination);     // it's needed because of common bug in the browsers
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
    var index = getIndexOfMaxAbsoluteValue(data);

    return data[index];
}

function getIndexOfMaxAbsoluteValue(data) {
    var i, maxIndex, max, value;

    for (i = 0; i < data.length; i++) {
        value = Math.abs(data[i]);
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
        draw();
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

function draw() {
    var
        timeDomainData = getTimeDomainData(),
        frequencyData = getFrequencyData(),
        maxAbsoluteSample = getMaxAbsoluteValue(timeDomainData),
        maxAbsoluteSampleUnit = normalizeToUnit(maxAbsoluteSample);

    domGaugeAnalyser.style.width = (maxAbsoluteSampleUnit * 100) + '%';
    drawTimeDomainData(ctxTimeDomainData, timeDomainData);
    drawFrequencyDomainData(ctxFrequencyData, frequencyData)
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
