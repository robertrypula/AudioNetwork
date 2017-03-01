// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    BUFFER_SIZE = 4 * 1024,
    MONO = 1,
    MONO_INDEX = 0,
    audioContext,
    microphone,
    microphoneVirtual,
    scriptProcessorNode,
    sampleGlobal = 0;

function init() {
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

}

function outputSampleHandler(monoOut, monoIn) {
    var i, v;

    for (i = 0; i < monoIn.length; i++) {
        v = generateSineWave(
            getSamplePerPeriod(500),
            1,
            0,
            sampleGlobal
        );
        monoOut[i] = v * monoIn[i];

        // monoOut[i] = Math.round(200 * monoIn[i]) / 200;

        sampleGlobal++;
    }
}