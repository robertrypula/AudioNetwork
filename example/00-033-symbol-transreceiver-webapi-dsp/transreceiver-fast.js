// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    TX_SYMBOL_TIME_MS = 120,
    TX_GUARD_TIME_MS = TX_SYMBOL_TIME_MS,
    audioMonoIO,
    txActive = false,
    symbolFrequency = [
        1000,   // A
        1200,   // B
        1600,   // C
        1800    // D
    ],
    symbolFrequencyBinIndex = [];

function init() {
    audioMonoIO = new AudioMonoIO();
    setInterval(updateFrequencyData, 50);

    for (var i = 0; i < symbolFrequency.length; i++) {
        symbolFrequencyBinIndex.push(
            convertFrequencyToFrequencyBinIndex(symbolFrequency[i])
        );
    }
}

function txTone(symbol) {
    if (txActive) {
        return;
    }

    txActive = true;
    audioMonoIO.setPeriodicWave(symbolFrequency[symbol], 0.01);
    setTimeout(function () {
        audioMonoIO.setPeriodicWave(0, 0);
        setTimeout(function () {
            txActive = false;
        }, TX_GUARD_TIME_MS);
    }, TX_SYMBOL_TIME_MS);
}

function updateFrequencyData() {
    var
        frequencyData = audioMonoIO.getFrequencyData(),
        amplitude,
        noiseLevel,
        signalToNoiseDiff,
        symbolAmplitude = [],
        symbolWithMaxAmplitude;

    noiseLevel = 0;
    for (var i = 0; i < symbolFrequencyBinIndex.length; i++) {
        amplitude = frequencyData[symbolFrequencyBinIndex[i]];
        noiseLevel += amplitude;
        symbolAmplitude.push(amplitude);
    }

    symbolWithMaxAmplitude = getIndexOfMax(symbolAmplitude);
    noiseLevel -= symbolAmplitude[symbolWithMaxAmplitude];
    noiseLevel /= symbolFrequencyBinIndex.length - 1;

    signalToNoiseDiff = symbolAmplitude[symbolWithMaxAmplitude] - noiseLevel;

    if (signalToNoiseDiff > 15) {
        document.getElementById('log').innerHTML += symbolWithMaxAmplitude + ' ' + signalToNoiseDiff + '<br/>';
    }
}

function getIndexOfMax(data) {
    var i, maxIndex, max;

    for (i = 0; i < data.length; i++) {
        if (i === 0 || data[i] > max) {
            max = data[i];
            maxIndex = i;
        }
    }

    return maxIndex;
}

function convertFrequencyToFrequencyBinIndex(frequency) {
    return Math.round(
        frequency * audioMonoIO.getFFTSize() / audioMonoIO.getSampleRate()
    );
}
