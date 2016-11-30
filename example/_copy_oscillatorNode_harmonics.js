// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE = 4 * 1024,
    SCRIPT_PROCESSOR_BUFFER = 4 * 1024,
    CANVAS_WIDTH = 1050,
    CANVAS_HEIGHT = 200,
    canvasContextTimeDomainData,
    canvasContextFrequencyDomainData,
    audioContext,
    mediaStreamAudioSourceNode,
    inputGainNode,
    inputAnalyzerNode,
    outputOscillatorNode,
    scriptProcessorNode,
    outputMergerNode_DELETE_ME,
    outputGainNode;

function init() {
    canvasContextTimeDomainData = document.getElementById('time-domain-data').getContext('2d');
    canvasContextTimeDomainData.lineWidth = 1;
    canvasContextTimeDomainData.strokeStyle = '#dadada';
    canvasContextFrequencyDomainData = document.getElementById('frequency-domain-data').getContext('2d');
    canvasContextFrequencyDomainData.lineWidth = 1;
    canvasContextFrequencyDomainData.strokeStyle = '#dadada';
    audioContext = new AudioContext();

    // input
    inputGainNode = audioContext.createGain();
    inputAnalyzerNode = audioContext.createAnalyser();
    inputAnalyzerNode.smoothingTimeConstant = 0;
    inputAnalyzerNode.fftSize = FFT_SIZE;
    // connectMicrophoneTo(inputGainNode);
    inputGainNode.connect(inputAnalyzerNode);
    requestAnimationFrame(refreshAnalyzerData);

    // output
    outputOscillatorNode = audioContext.createOscillator();
    outputGainNode = audioContext.createGain();
    scriptProcessorNode = audioContext.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER, 1, 1);
    outputMergerNode_DELETE_ME = audioContext.createChannelMerger(1);
    
    outputOscillatorNode.connect(outputGainNode);
    outputGainNode.connect(outputMergerNode_DELETE_ME);
    scriptProcessorNode.connect(outputMergerNode_DELETE_ME);

    outputMergerNode_DELETE_ME.connect(audioContext.destination);
    outputMergerNode_DELETE_ME.connect(inputGainNode);

    scriptProcessorNode.onaudioprocess = function (audioProcessingEvent) {
        outputDataHandler(
            audioProcessingEvent.outputBuffer.getChannelData(0)
        );
    };

    updateRandomTone();
    outputOscillatorNode.start();
    setInterval(updateRandomTone, 1000);
}

function generateSineWave(samplePerPeriod, amplitude, degreesPhaseOffset, sample) {
    var unitPhaseOffset = degreesPhaseOffset / 360;

    return amplitude * Math.sin(2 * Math.PI * (sample / samplePerPeriod - unitPhaseOffset));
}



function getSamplePerPeriodFromFrequency(frequency) {
    return audioContext.sampleRate / frequency;
}

var samplePerPeriod = 0;
var phase = 0;
var sampleGlobalCount = 0;

function outputDataHandler(outputData) {
    var i, value;

    samplePerPeriod = getSamplePerPeriodFromFrequency(200); //1033.6);

    if (!samplePerPeriod) {
        return;
    }

    for (i = 0; i < outputData.length; i++) {
        // outputData[i] = (-1 + Math.random() * 2) * 0.02;
        // continue;
        value = 0;
        value += generateSineWave(samplePerPeriod / 1, 0.1 * 1/1, phase, sampleGlobalCount);
        value += generateSineWave(samplePerPeriod / 3, 0.1 * 1/3, phase, sampleGlobalCount);
        value += generateSineWave(samplePerPeriod / 5, 0.1 * 1/5, phase, sampleGlobalCount);
        value += generateSineWave(samplePerPeriod / 7, 0.1 * 1/7, phase, sampleGlobalCount);

        value *= generateSineWave(getSamplePerPeriodFromFrequency(5000), 10, phase, sampleGlobalCount);

        // value += generateSineWave(getSamplePerPeriodFromFrequency(7000), 0.01, phase, sampleGlobalCount);

        outputData[i] = value;
        sampleGlobalCount++;
    }
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
            mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(stream);
            mediaStreamAudioSourceNode.connect(node);
        });
}

function refreshAnalyzerData() {
    var timeDomainData, frequencyDomainData, ctx, i, x1, y1, x2, y2, loopLimit;

    timeDomainData = new Float32Array(inputAnalyzerNode.fftSize);
    inputAnalyzerNode.getFloatTimeDomainData(timeDomainData);
    ctx = canvasContextTimeDomainData;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    loopLimit = Math.min(CANVAS_WIDTH, timeDomainData.length);
    for (i = 0; i < loopLimit; i++) {
        x1 = i;
        y1 = 0.5 * CANVAS_HEIGHT - timeDomainData[i] * (0.5 * CANVAS_HEIGHT - 1);
        x2 = x1 + 1;
        y2 = 0.5 * CANVAS_HEIGHT - timeDomainData[i  + 1] * (0.5 * CANVAS_HEIGHT - 1);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.stroke();
    }

    frequencyDomainData = new Float32Array(inputAnalyzerNode.frequencyBinCount);
    inputAnalyzerNode.getFloatFrequencyData(frequencyDomainData);
    ctx = canvasContextFrequencyDomainData;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    loopLimit = Math.min(CANVAS_WIDTH, frequencyDomainData.length);
    for (i = 0; i < loopLimit; i++) {
        x1 = i;
        y1 = (frequencyDomainData[i] / -100) * (CANVAS_HEIGHT - 1);
        x2 = x1 + 1;
        y2 = (frequencyDomainData[i  + 1] / -100) * (CANVAS_HEIGHT - 1);

        if (i === 0) {
            x1 = loopLimit - 1;
            y1 = 0;
            x2 = x1;
            y2 = (loopLimit - 1);
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.stroke();
    }

    requestAnimationFrame(refreshAnalyzerData);
}

var preriodicWave;
var phase = 0;

function updateRandomTone() {
    var now = audioContext.currentTime;
    var harmonicNumber;
    var x;
    var i;
    var real, imag;

    var harmonicAmplitude = [
      1,     // 1
      0,     // 2
      1/3,   // 3
      0,     // 4
      1/5    // 5
    ];

    real = new Float32Array(1 + harmonicAmplitude.length);
    imag = new Float32Array(1 + harmonicAmplitude.length);
    x = 2 * Math.PI * (-phase);
    real[0] = 0;
    imag[0] = 0;
    for (i = 0; i < harmonicAmplitude.length; i++) {
        harmonicNumber = 1 + i;
        real[harmonicNumber] = harmonicAmplitude[i] * Math.sin(x * harmonicNumber);
        imag[harmonicNumber] = harmonicAmplitude[i] * Math.cos(x * harmonicNumber);
    }

    preriodicWave = audioContext.createPeriodicWave(real, imag);
    outputOscillatorNode.setPeriodicWave(preriodicWave);

    phase += 0.25;

    outputOscillatorNode.frequency.setValueAtTime(
        190,// 1033.6
        now
    );
    outputGainNode.gain.setValueAtTime(
        0.0,
        now
    );

    // alternative version:
    /*
     outputOscillatorNode.frequency.value = 1000 + Math.random() * 2000;
     outputGainNode.gain.value = 0.1 + Math.random() * 0.4
     */
}
