// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var FFTResult;

FFTResult = function () {
};

FFTResult.convertFrequencyBinIndexToFrequency = function (frequencyBinIndex, sampleRate, fftSize) {
    var frequencyBinCount = 0.5 * fftSize;

    if (frequencyBinIndex < 0 || frequencyBinIndex >= frequencyBinCount) {
        throw 'FrequencyBinIndex out of range';
    }

    return frequencyBinIndex * sampleRate / fftSize;
};

FFTResult.convertFrequencyToFrequencyBinIndex = function (frequency, sampleRate, fftSize) {
    var
        frequencyBinIndex = Math.round(frequency * fftSize / sampleRate),
        frequencyBinCount = 0.5 * fftSize;

    if (frequencyBinIndex < 0 || frequencyBinIndex >= frequencyBinCount) {
        throw 'FrequencyBinIndex out of range';
    }

    return frequencyBinIndex;
};

FFTResult.prototype.something = function () {

};
