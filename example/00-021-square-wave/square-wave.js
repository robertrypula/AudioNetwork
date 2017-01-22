// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FREQUENCY = 1000,
    SILENCE = 0,
    audioContext,
    oscillator,
    oscillatorVolume,
    squareWaveAmplitudeList = [
        0,   // [0] 0 Hz (DC offset) browser is ignoring this value
        1/1, // [1] first harmonic  - {baseFreq} x 1 fundamental tone
        0,   // [2] second harmonic - {baseFreq} x 2
        1/3, // [3] third harmonic  - {baseFreq} x 3
        0,   // [4] fourth harmonic - {baseFreq} x 4
        1/5  // [5] fifth harmonic  - {baseFreq} x 5
        // ...
        // even harmonics have always amplitude equal to zero
        // odd harmonics have always amplitude equal to 1 / {harmonicNumber}
    ];

function init() {
    audioContext = new AudioContext();

    oscillator = audioContext.createOscillator();
    oscillatorVolume = audioContext.createGain();

    updateFrequency(FREQUENCY);
    updateVolume(SILENCE);
    updateOscillator('custom');

    oscillator.start();

    oscillator.connect(oscillatorVolume);
    oscillatorVolume.connect(audioContext.destination);
}

function updateVolume(volume) {
    oscillatorVolume.gain.value = volume;
    oscillatorVolume.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );
}

function updateFrequency(frequency) {
    oscillator.frequency.value = frequency;
    oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime
    );
}

function updateOscillator(type) {
    var periodicWave;

    if (type === 'custom') {
        periodicWave = getPeriodicWave();
        oscillator.setPeriodicWave(periodicWave);

    } else {
        oscillator.type = 'square';
    }
}

function getPeriodicWave() {
    var real, imag;

    // NOTE: for no phase shift we need to put amplitudes to imaginary array
    real = new Float32Array(squareWaveAmplitudeList.length); // this will fill array with zeros
    imag = new Float32Array(squareWaveAmplitudeList);        // amplitude array goes here

    return audioContext.createPeriodicWave(real, imag);
}
