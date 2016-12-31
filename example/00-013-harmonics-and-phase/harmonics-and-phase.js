// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var audioMonoIO, txFrequency, txPhase, txVolume, txHarmonicAmplitude;

function init() {
    txFrequency = 2000;
    txVolume = 0.5;
    txPhase = 0;
    txHarmonicAmplitude = undefined;
    audioMonoIO = new AudioMonoIO(1024, 1024);
}

function updateOutputWave() {
    audioMonoIO.setOutputWave(
        txFrequency,
        txVolume,
        txPhase,
        txHarmonicAmplitude
    );
}

function harmonicAmplitudeChange(type) {
    switch (type) {
        case 'sine':
            txHarmonicAmplitude = undefined;
            break;
        case 'square':
            txHarmonicAmplitude = getSquareHarmonicAmplitude();
            break;
        default:
            txHarmonicAmplitude = undefined;
    }
    updateOutputWave();
}

function getSquareHarmonicAmplitude() {
    return [
        1,
        0,
        1/3,
        0,
        1/5,
        0,
        1/7,
        0,
        1/9,
        0,
        1/11,
        0,
        1/13,
        0,
        1/15
    ];
}

function volumeChange(volume) {
    txVolume = volume;
    updateOutputWave();
}

function phaseChange(phase) {
    txPhase = phase;
    updateOutputWave();
}

function frequencyChange(frequecy) {
    txFrequency = frequecy;
    updateOutputWave();
}