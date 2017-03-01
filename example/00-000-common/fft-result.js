// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var FFTResult;

FFTResult = function (fftData, sampleRate) {
    this.$$fftData = fftData;
    this.$$fftSize = 2 * fftData.length;
    this.$$sampleRate = sampleRate;
};

FFTResult.$$_FREQUENCY_BIN_INDEX_ZERO = 0;
FFTResult.$$_FREQUENCY_BIN_INDEX_FIRST = 1;
FFTResult.$$_EQUAL_EPSILON = 0.001;
FFTResult.$$_HALF = 0.5;

FFTResult.prototype.getLoudestBinIndex = function (frequencyStart, frequencyEnd) {
    return this.$$getLoudestBinIndexInRange(
        frequencyStart,
        frequencyEnd
    );
};

FFTResult.prototype.getLoudestFrequency = function (frequencyStart, frequencyEnd) {
    var loudestBinIndex = this.$$getLoudestBinIndexInRange(
        frequencyStart,
        frequencyEnd
    );

    return FFTResult.getFrequency(
        loudestBinIndex,
        this.$$sampleRate,
        this.$$fftSize
    );
};

FFTResult.prototype.getLoudestDecibel = function (frequencyStart, frequencyEnd) {
    var loudestBinIndex = this.$$getLoudestBinIndexInRange(
        frequencyStart,
        frequencyEnd
    );

    return this.$$fftData[loudestBinIndex];
};

FFTResult.prototype.getDecibel = function (frequencyBinIndex) {
    return this.$$fftData[frequencyBinIndex];
};

FFTResult.prototype.getDecibelFromFrequency = function (frequency) {
    var binIndex = this.getBinIndex(frequency);

    return this.$$fftData[binIndex];
};

FFTResult.prototype.getFrequency = function (frequencyBinIndex) {
    return FFTResult.getFrequency(
        frequencyBinIndex,
        this.$$sampleRate,
        this.$$fftSize
    );
};

FFTResult.prototype.getFrequencyOfClosestBin = function (frequency) {
    return FFTResult.getFrequencyOfClosestBin(
        frequency,
        this.$$sampleRate,
        this.$$fftSize
    );
};

FFTResult.prototype.getBinIndex = function (frequency) {
    return FFTResult.getBinIndex(
        frequency,
        this.$$sampleRate,
        this.$$fftSize
    );
};

FFTResult.prototype.getResolution = function () {
    return FFTResult.getResolution(
        this.$$sampleRate,
        this.$$fftSize
    );
};

FFTResult.prototype.getLastBinIndex = function () {
    return this.$$fftData.length - 1;
};

FFTResult.prototype.getLastFrequency = function () {
    return this.getFrequency(
        this.getLastBinIndex()
    );
};

FFTResult.prototype.getNyquistFrequency = function () {
    return FFTResult.$$_HALF * this.$$sampleRate;
};

FFTResult.prototype.getFFTSize = function () {
    return this.$$fftSize;
};

FFTResult.prototype.equal = function (fftResult) {
    var
        i,
        absDiff,
        isFrequencyEqual,
        isFFTSizeEqual,
        isAllDecibelEqual;

    isFrequencyEqual = FFTResult.$$isEqual(
        this.getNyquistFrequency(),
        fftResult.getNyquistFrequency()
    );
    isFFTSizeEqual = FFTResult.$$isEqual(
        this.getFFTSize(),
        fftResult.getFFTSize()
    );

    if (!isFrequencyEqual || !isFFTSizeEqual) {
        return false;
    }

    isAllDecibelEqual = true;
    for (i = 0; i < this.$$fftData.length; i++) {
        absDiff = Math.abs(
            this.$$fftData[i] - fftResult.getDecibel(i)
        );
        if (absDiff > FFTResult.$$_EQUAL_EPSILON) {
            isAllDecibelEqual = false;
            break;
        }
    }

    return isAllDecibelEqual;
};

FFTResult.prototype.$$getLoudestBinIndexInRange = function (frequencyStart, frequencyEnd) {
    var
        frequencyBinIndexStart,
        frequencyBinIndexEnd,
        loudestBinIndex;

    frequencyStart = FFTResult.$$getValueOrDefault(
        frequencyStart,
        FFTResult.$$_FREQUENCY_BIN_INDEX_ZERO
    );
    frequencyEnd = FFTResult.$$getValueOrDefault(
        frequencyEnd,
        this.getLastFrequency()
    );

    frequencyBinIndexStart = this.getBinIndex(frequencyStart);
    frequencyBinIndexEnd = this.getBinIndex(frequencyEnd);

    loudestBinIndex = FFTResult.$$findMaxIndexInRange(
        this.$$fftData,
        frequencyBinIndexStart,
        frequencyBinIndexEnd
    );

    return loudestBinIndex;
};

FFTResult.$$isEqual = function (a, b) {
    return a === b;
};

FFTResult.$$getValueOrDefault = function (value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
};

FFTResult.$$findMaxIndexInRange = function (data, indexMin, indexMax) {
    var maxIndex, max, i;

    maxIndex = -1;
    max = undefined;
    for (i = indexMin; i <= indexMax; i++) {
        if (maxIndex === -1 || data[i] > max) {
            max = data[i];
            maxIndex = i;
        }
    }

    return maxIndex;
};

FFTResult.getResolution = function (sampleRate, fftSize) {
    return FFTResult.getFrequency(
        FFTResult.$$_FREQUENCY_BIN_INDEX_FIRST,
        sampleRate,
        fftSize
    );
};

FFTResult.getFrequency = function (frequencyBinIndex, sampleRate, fftSize) {
    var frequencyBinCount = FFTResult.$$_HALF * fftSize;

    if (frequencyBinIndex < 0 || frequencyBinIndex >= frequencyBinCount) {
        throw 'FrequencyBinIndex out of range';
    }

    return frequencyBinIndex * sampleRate / fftSize;
};

FFTResult.getBinIndex = function (frequency, sampleRate, fftSize) {
    var
        frequencyBinIndex = Math.round(frequency * fftSize / sampleRate),
        frequencyBinCount = FFTResult.$$_HALF * fftSize;

    if (frequencyBinIndex < 0 || frequencyBinIndex >= frequencyBinCount) {
        throw 'FrequencyBinIndex out of range';
    }

    return frequencyBinIndex;
};

FFTResult.getFrequencyOfClosestBin = function (frequency, sampleRate, fftSize) {
    var binIndex = FFTResult.getBinIndex(frequency, sampleRate, fftSize);

    return FFTResult.getFrequency(
        binIndex,
        sampleRate,
        fftSize
    );
};
