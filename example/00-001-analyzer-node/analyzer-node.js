// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    LIMIT_CANVAS_WIDTH = true,
    FFT_SIZE = 2 * 1024,         // powers of 2 in range: 32, 32768
    CANVAS_WIDTH_TIME_DOMAIN = FFT_SIZE,
    CANVAS_WIDTH_FREQUENCY = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -100,
    audioContext,
    microphone,
    microphoneVirtual,
    analyzer,
    animationFrameFirstCall = true,
    ctxTimeDomainData,
    ctxFrequencyData;

function init() {
    ctxTimeDomainData = getConfiguredCanvasContext('canvas-time-domain-data', CANVAS_WIDTH_TIME_DOMAIN, CANVAS_HEIGHT);
    ctxFrequencyData = getConfiguredCanvasContext('canvas-frequency-data', CANVAS_WIDTH_FREQUENCY, CANVAS_HEIGHT);

    audioContext = new AudioContext();
    microphoneVirtual = audioContext.createGain();
    analyzer = audioContext.createAnalyser();
    analyzer.smoothingTimeConstant = 0;
    analyzer.fftSize = FFT_SIZE;
    connectMicrophoneTo(microphoneVirtual);
    microphoneVirtual.connect(analyzer);

    animationFrame();
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

function connectMicrophoneTo(node) {
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
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(node);
        });
}

function animationFrame() {
    if (!animationFrameFirstCall) {
        draw();
    } else {
        animationFrameFirstCall = false;
    }
    requestAnimationFrame(animationFrame);
}

function draw() {
    drawTimeDomainData(ctxTimeDomainData);
    drawFrequencyDomainData(ctxFrequencyData)
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

function drawTimeDomainData(ctx) {
    var data, limit, hMid, x, y1, y2;

    clear(ctx);

    hMid = Math.floor(0.5 * CANVAS_HEIGHT);
    data = new Float32Array(analyzer.fftSize);
    analyzer.getFloatTimeDomainData(data);

    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMid * (1 - data[x]);
        y2 = hMid * (1 - data[x + 1]);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}

function drawFrequencyDomainData(ctx) {
    var data, limit, hMaxPix, x, y1, y2;

    clear(ctx);

    hMaxPix = CANVAS_HEIGHT - 1;
    data = new Float32Array(analyzer.frequencyBinCount);
    analyzer.getFloatFrequencyData(data);

    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMaxPix * (data[x] / DECIBEL_MIN);
        y2 = hMaxPix * (data[x  + 1] / DECIBEL_MIN);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}
