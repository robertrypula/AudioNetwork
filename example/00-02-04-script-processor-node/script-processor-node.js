// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    LIMIT_CANVAS_WIDTH = true,
    BUFFER_SIZE = 1 * 1024,
    CANVAS_WIDTH = BUFFER_SIZE,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    MONO = 1,
    MONO_INDEX = 0,
    ctxInput,
    ctxOutput,
    audioContext,
    microphone,
    microphoneVirtual,
    scriptProcessorNode,
    rawSineAmplitude = 0.01,
    rawSineFrequency = 1000,
    rawSinePhase = 0,
    mixWithMicrophoneCheckbox,
    sampleGlobal = 0;

function init() {
    mixWithMicrophoneCheckbox = document.getElementById('mix-with-microphone');
    ctxInput = getConfiguredCanvasContext('canvas-input', CANVAS_WIDTH, CANVAS_HEIGHT);
    ctxOutput = getConfiguredCanvasContext('canvas-output', CANVAS_WIDTH, CANVAS_HEIGHT);

    audioContext = new AudioContext();

    microphoneVirtual = audioContext.createGain();
    connectMicrophoneTo(microphoneVirtual);

    scriptProcessorNode = audioContext.createScriptProcessor(BUFFER_SIZE, MONO, MONO);
    scriptProcessorNode.onaudioprocess = function (audioProcessingEvent) {
        var monoDataOut, monoDataIn;

        monoDataIn = audioProcessingEvent
            .inputBuffer
            .getChannelData(MONO_INDEX);
        monoDataOut = audioProcessingEvent
            .outputBuffer
            .getChannelData(MONO_INDEX);

        inputSampleHandler(monoDataIn);
        outputSampleHandler(monoDataOut, monoDataIn);
    };

    microphoneVirtual.connect(scriptProcessorNode);
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

// -----------------------------------------------------------------------

function rawSineUpdateVolume(volume) {
    rawSineAmplitude = volume;
}

function rawSineUpdateFrequency(frequency) {
    rawSineFrequency = frequency;
}

function rawSineUpdatePhase(phase) {
    rawSinePhase = phase;
}

// -----------------------------------------------------------------------
// canvas 2d context

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

// -----------------------------------------------------------------------
// sine wave generator

function getSamplePerPeriod(frequency) {
    return audioContext.sampleRate / frequency;
}

function generateSineWave(samplePerPeriod, amplitude, degreesPhaseOffset, sample) {
    var
        unitPhaseOffset = degreesPhaseOffset / 360,
        x = 2 * Math.PI * (sample / samplePerPeriod - unitPhaseOffset);

    return amplitude * Math.sin(x);
}

// -----------------------------------------------------------------------
// script processor handlers

function inputSampleHandler(monoIn) {
    drawTimeDomainData(ctxInput, monoIn);
}

function outputSampleHandler(monoOut, monoIn) {
    var
      rawSineSample,
      i;

    for (i = 0; i < monoIn.length; i++) {
        rawSineSample = generateSineWave(
            getSamplePerPeriod(rawSineFrequency),
            rawSineAmplitude,
            rawSinePhase,
            sampleGlobal
        );

        if (mixWithMicrophoneCheckbox.checked) {
            monoOut[i] = rawSineSample * monoIn[i];
        } else {
            monoOut[i] = rawSineSample;
        }

        sampleGlobal++;
    }

    drawTimeDomainData(ctxOutput, monoOut);
}
