// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FREQUENCY = 1000,
    SILENCE = 0,
    audioContext,
    oscillator,
    oscillatorVolume,
    squareWaveGlobalPhase = 0.75,  // whole square shape will move to the right by 270 degrees
    squareWaveAmplitudeList = [
        1/1, // [1] first harmonic  - {baseFreq} x 1 fundamental tone
        0,   // [2] second harmonic - {baseFreq} x 2
        1/3, // [3] third harmonic  - {baseFreq} x 3
        0,   // [4] fourth harmonic - {baseFreq} x 4
        1/5  // [5] fifth harmonic  - {baseFreq} x 5
        // ...
        // even harmonics have always amplitude equal to zero
        // odd harmonics have always amplitude equal to 1 / {harmonicNumber}
    ],
    squareWavePhaseList = [
        0, // [1] first harmonic 'local' phase shift
        0, // [2] second harmonic 'local' phase shift
        0, // [3] third harmonic 'local' phase shift
        0, // [4] fourth harmonic 'local' phase shift
        0  // [5] fifth harmonic 'local' phase shift
        // ...
        // square wave doesn't need any phase shift at any of it's harmonics
        // but you can easily create different shapes just by playing with those values
    ];

function init() {
    audioContext = new AudioContext();

    oscillator = audioContext.createOscillator();
    oscillatorVolume = audioContext.createGain();

    updateFrequency(FREQUENCY);
    updateVolume(SILENCE);
    updateOscillator();

    oscillator.start();

    oscillator.connect(oscillatorVolume);
    oscillatorVolume.connect(audioContext.destination);
}

function updateVolume(volume) {
    setImmediately(oscillatorVolume.gain, volume);
}

function updateFrequency(frequency) {
    setImmediately(oscillator.frequency, frequency);
}

function updatePhase(phase) {
    squareWaveGlobalPhase = phase;
    updateOscillator();
}

function updateOscillator() {
    var periodicWave;

    periodicWave = getPeriodicWave(
        squareWaveGlobalPhase,
        squareWaveAmplitudeList,
        squareWavePhaseList
    );
    oscillator.setPeriodicWave(periodicWave);
}

function getPeriodicWave(globalPhase, harmonicAmplitude, harmonicPhase) {
    var
        real,
        imag,
        harmonicNumber,
        i,
        phaseRadianGlobal,
        phaseRadianLocal,
        finalRadian;

    if (harmonicAmplitude.length !== harmonicPhase.length) {
        throw 'Length of amplitude and phase arrays should match';
    }
    if (harmonicAmplitude.length < 1) {
        throw 'Amplitude and phase arrays should have at least one item';
    }

    real = new Float32Array(1 + harmonicAmplitude.length);
    imag = new Float32Array(1 + harmonicAmplitude.length);
    phaseRadianGlobal = 2 * Math.PI * (-globalPhase);
    real[0] = 0;   // DC-offset is always zero
    imag[0] = 0;
    for (i = 0; i < harmonicAmplitude.length; i++) {
        harmonicNumber = 1 + i;
        phaseRadianLocal = 2 * Math.PI * (-harmonicPhase[i]);
        finalRadian = phaseRadianGlobal * harmonicNumber + phaseRadianLocal;
        real[harmonicNumber] = harmonicAmplitude[i] * Math.sin(finalRadian);
        imag[harmonicNumber] = harmonicAmplitude[i] * Math.cos(finalRadian);
    }

    return audioContext.createPeriodicWave(real, imag);
}

function setImmediately(audioParam, value) {
    var now = audioContext.currentTime;

    audioParam.value = value;
    audioParam.setValueAtTime(value, now);
}
