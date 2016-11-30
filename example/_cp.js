// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    audioContext = null,
    inputNode = null,
    inputNodeAnalyzer = null,
    inputNodeScriptProcessorAnalyzer = null,
    inputNodeScriptProcessor = null,
    outputNodeOscilator = null,
    outputNodeScriptProcessor = null,
    preriodicWave = null,
    masterGain = null;

function normalizeGlobalVariable() {
    window.AudioContext =
        window.AudioContext ||
        window.webkitAudioContext ||
        window.mozAudioContext;
    navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
}

function logAndRethrow(error, message) {
    alert(message);
    console.log(error);
    throw error;
}

function getAudioContext() {
    var audioContext = null;

    normalizeGlobalVariable();
    try {
        audioContext = new window.AudioContext();
    } catch (error) {
        logAndRethrow(error, 'Web Audio API is not supported in this browser');
    }

    return audioContext;
}

function connectMicrophoneTo(node) {
    var
        microphoneNode,
        constraints = {
            video: false,
            audio: {
                mandatory: {
                    googEchoCancellation: false, // disabling audio processing
                    googAutoGainControl: false,
                    googNoiseSuppression: false,
                    googHighpassFilter: false
                },
                optional: []
            }
        };

    try {
        navigator.getUserMedia(
            constraints,
            function (stream) {
                microphoneNode = audioContext.createMediaStreamSource(stream);
                microphoneNode.connect(node);
            },
            function (error) {
                logAndRethrow(error, 'Microphone initialization failed');
            }
        );
    } catch (e) {
        logAndRethrow(error, 'Microphone initialization failed');
    }
}

function audioSampleMonoIO(bufferSize) {
    audioContext = getAudioContext();
    inputNode = audioContext.createGain();
    inputNodeAnalyzer = audioContext.createAnalyser();
    inputNodeScriptProcessorAnalyzer = audioContext.createAnalyser();
    inputNodeScriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    outputNodeOscilator = audioContext.createOscillator();
    outputNodeScriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    masterGain = audioContext.createGain();

    inputNodeAnalyzer.maxDecibels = 0;
    inputNodeAnalyzer.minDecibels = -80;
    inputNodeAnalyzer.smoothingTimeConstant = 0;
    setFrequency(0);
    outputNodeOscilator.start();

    inputNodeScriptProcessor.onaudioprocess = function (audioProcessingEvent) {
        inputDataHandler(
            audioProcessingEvent.inputBuffer.getChannelData(0)
        );
    };
    outputNodeScriptProcessor.onaudioprocess = function (audioProcessingEvent) {
        outputDataHandler(
            audioProcessingEvent.outputBuffer.getChannelData(0)
        );
    };

    connectMicrophoneTo(inputNode);
    inputNode.connect(inputNodeScriptProcessor);
    inputNode.connect(inputNodeAnalyzer);
    inputNodeScriptProcessor.connect(inputNodeScriptProcessorAnalyzer);

    outputNodeOscilator.connect(masterGain);
    outputNodeScriptProcessor.connect(masterGain);
    masterGain.connect(audioContext.destination);
}

function setFrequency(frequency, phase) {
    var
        real = new Float32Array(2),
        imag = new Float32Array(2);

    real[0] = 0;
    imag[0] = 0;
    real[1] = Math.cos(2 * Math.PI * phase);
    imag[1] = Math.sin(2 * Math.PI * phase);
    /*
    real[2] = 0.4;
    imag[2] = 0;
    real[3] = 0.3;
    imag[3] = 0;
    */

    preriodicWave = audioContext.createPeriodicWave(real, imag);
    outputNodeOscilator.setPeriodicWave(preriodicWave);
    outputNodeOscilator.frequency.value = frequency;
}

function getFFT(fftSize) {
    var data;

    inputNodeAnalyzer.fftSize = fftSize;
    data = new Uint8Array(inputNodeAnalyzer.frequencyBinCount);
    inputNodeAnalyzer.getByteFrequencyData(data);

    return data;
}
// ---------------------------------------------------------------

function init() {
    audioSampleMonoIO(1024);
    updateFFT();
}

function inputDataHandler(inputData) {
    // console.log('inputDataHandler ' + inputData.length);
    // return;
    var
        element = document.getElementById('log'),
        maxAbs = 0,
        valueAbs;

    inputData.forEach(function (value) {
        valueAbs = Math.abs(value);
        if (valueAbs > maxAbs) {
            maxAbs = valueAbs;
        }
    });
    element.innerHTML = Math.round(maxAbs * 1000) / 1000;
}

var samplePerPeriod = 0;
var phase = 0;
var sampleGlobalCount = 0;

function outputDataHandler(outputData) {
    // console.log('outputDataHandler ' + outputData.length);
    return;
    var i, value;

    for (i = 0; i < outputData.length; i++) {
        outputData[i] = (-1 + Math.random() * 2) * 0.02;
        continue;
        if (samplePerPeriod > 0) {
            value = generateSineWave(samplePerPeriod, 0.75, phase, sampleGlobalCount);
        } else {
            value = 0;
        }
        outputData[i] = value;
        sampleGlobalCount++;
    }
}

function generateSineWave(samplePerPeriod, amplitude, degreesPhaseOffset, sample) {
    var unitPhaseOffset = degreesPhaseOffset / 360;

    return amplitude * Math.sin(2 * Math.PI * (sample / samplePerPeriod - unitPhaseOffset));
}

function pianoKey(n) {
    var f;

    f = Math.pow(2, (n - 49)/12) * 440;
    document.getElementById('frequency-to-send').value = f;
    updateFrequencyToSend()
}

function updateFrequencyToSend() {
    var element, frequency;

    element = document.getElementById('frequency-to-send');
    frequency = parseFloat(element.value);
    samplePerPeriod = frequency > 0 ? audioContext.sampleRate / frequency : 0;

    element = document.getElementById('phase-to-send');
    phase = parseFloat(element.value);

    setFrequency(frequency, phase);
}

function updateFFT() {
    var
        element = document.getElementById('frequency'),
        fftSize = 16 * 1024,
        fft = getFFT(fftSize),
        frequency,
        maxIndex = -1,
        max,
        decibel;

    fft.forEach(function (value, index) {
        if (value > max || maxIndex === -1) {
            max = value;
            maxIndex = index;
        }
    });

    frequency = Math.round((maxIndex * audioContext.sampleRate / fftSize) * 10) / 10;
    decibel = Math.round((-80 + (max / 255) * 80) * 10) / 10; // TODO convert to decibels
    element.innerHTML = frequency + ' Hz <br/>(' + decibel + ' dB)';

    /*
     0:   0 * 44100 / 1024 =     0.0 Hz
     1:   1 * 44100 / 1024 =    43.1 Hz
     2:   2 * 44100 / 1024 =    86.1 Hz
     3:   3 * 44100 / 1024 =   129.2 Hz
     4:   ...
     5:   ...
     ...
     511: 511 * 44100 / 1024 = 22006.9 Hz
     */
    // {i}:   {i} * {sampleRate} / {fftSize} =    {frequency} Hz        i <0, fft.length
    // http://stackoverflow.com/questions/4364823/how-do-i-obtain-the-frequencies-of-each-value-in-an-fft

    // requestAnimationFrame(updateFFT);
    setTimeout(updateFFT, 50);
}
