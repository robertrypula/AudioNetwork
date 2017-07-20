// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

/*
TODO:
    - add barker code as default to correlator class
    - make private methods: setSkipFactor, getCorrelationThresgold
    - move similar methods closer each other
 */

var Correlator;

Correlator = function (skipFactor, code) {
    this.$$code = code
        ? code.slice(0)
        : Correlator.DEFAULT_SYNC_CODE.slice(0);

    this.$$skipFactor = undefined;
    this.$$dataBuffer = undefined;
    this.$$signalDecibelBuffer = undefined;
    this.$$noiseDecibelBuffer = undefined;
    this.$$cacheCorrelactionValue = undefined;
    this.$$cacheSignalDecibelAverage = undefined;
    this.$$cacheNoiseDecibelAverage = undefined;

    this.setSkipFactor(skipFactor);
};

Correlator.DEFAULT_SYNC_CODE = [1, -1, 1, -1, 1, -1];

Correlator.CORRELATION_POSITIVE = 'CORRELATION_POSITIVE';
Correlator.CORRELATION_NONE = 'CORRELATION_NONE';
Correlator.CORRELATION_NEGATIVE = 'CORRELATION_NEGATIVE';

Correlator.THRESHOLD = 0.9;
Correlator.NO_DECIBEL = null;
Correlator.NO_DATA = 0;

Correlator.POSITION_OUT_OF_RANGE_EXCEPTION = 'Position out of range';

Correlator.prototype.getCode = function () {
    return this.$$code.slice(0);
};

Correlator.prototype.getCodeLength = function () {
    return this.$$code.length;
};

Correlator.prototype.reset = function () {
    this.setSkipFactor(this.$$skipFactor);     // setting skip factor is like reset
};

Correlator.prototype.setSkipFactor = function (skipFactor) {
    var i, bufferMaxSize;

    skipFactor = skipFactor || 1;
    bufferMaxSize = this.$$code.length * skipFactor;

    this.$$skipFactor = skipFactor;
    this.$$dataBuffer = new Buffer(bufferMaxSize);
    this.$$signalDecibelBuffer = new Buffer(bufferMaxSize);
    this.$$noiseDecibelBuffer = new Buffer(bufferMaxSize);
    this.$$cacheCorrelactionValue = undefined;
    this.$$cacheSignalDecibelAverage = undefined;
    this.$$cacheNoiseDecibelAverage = undefined;

    for (i = 0; i < bufferMaxSize; i++) {
        this.$$dataBuffer.pushEvenIfFull(Correlator.NO_DATA);
        this.$$signalDecibelBuffer.pushEvenIfFull(Correlator.NO_DECIBEL);
        this.$$noiseDecibelBuffer.pushEvenIfFull(Correlator.NO_DECIBEL);
    }
};

Correlator.prototype.handle = function (signalValue, signalDecibel, noiseDecibel) {
    var data, isValidDecibel;

    data = Correlator.NO_DATA;
    switch (signalValue) {
        case -1:
        case 1:
            data = signalValue;
    }
    this.$$dataBuffer.pushEvenIfFull(data);

    isValidDecibel = data && (signalDecibel || signalDecibel === 0);
    this.$$signalDecibelBuffer.pushEvenIfFull(
        isValidDecibel ? signalDecibel : Correlator.NO_DECIBEL
    );

    isValidDecibel = data && (noiseDecibel || noiseDecibel === 0);
    this.$$noiseDecibelBuffer.pushEvenIfFull(
        isValidDecibel ? noiseDecibel : Correlator.NO_DECIBEL
    );

    this.$$clearCache();
};

Correlator.prototype.getCorrelationValueThreshold = function () {
    return Math.floor(Correlator.THRESHOLD * this.$$code.length);
};

Correlator.prototype.isCorrelated = function () {
    var correlation = this.getCorrelation();

    return (
        correlation === Correlator.CORRELATION_NEGATIVE ||
        correlation === Correlator.CORRELATION_POSITIVE
    );
};

Correlator.prototype.getCorrelation = function () {
    var
        correlationValue = this.getCorrelationValue(),
        correlationValueThreshold = this.getCorrelationValueThreshold();

    if (correlationValue >= correlationValueThreshold) {
        return Correlator.CORRELATION_POSITIVE;
    }
    if (correlationValue > -correlationValueThreshold) {
        return Correlator.CORRELATION_NONE;
    }

    return Correlator.CORRELATION_NEGATIVE;
};

Correlator.prototype.$$clearCache = function () {
    this.$$cacheCorrelactionValue = undefined;
    this.$$cacheSignalDecibelAverage = undefined;
    this.$$cacheNoiseDecibelAverage = undefined;
};

Correlator.prototype.$$getDecibelAverage = function (buffer) {
    var i, lastIndexInSkipBlock, bufferIndex, value, sum, sumLength, average;

    sum = 0;
    sumLength = 0;
    lastIndexInSkipBlock = this.$$skipFactor - 1;
    for (i = 0; i < this.$$code.length; i++) {
        bufferIndex = lastIndexInSkipBlock + i * this.$$skipFactor;
        value = buffer.getItem(bufferIndex);
        if (value !== Correlator.NO_DECIBEL) {
            sum += value;
            sumLength++;
        }
    }

    average = (sumLength > 0)
        ? sum / sumLength
        : Correlator.NO_DECIBEL;

    return average;
};

Correlator.prototype.getSignalDecibelAverage = function () {
    if (this.$$cacheSignalDecibelAverage === undefined) {
        this.$$cacheSignalDecibelAverage = this.$$getDecibelAverage(this.$$signalDecibelBuffer);
    }

    return this.$$cacheSignalDecibelAverage;
};

Correlator.prototype.getNoiseDecibelAverage = function () {
    if (this.$$cacheNoiseDecibelAverage === undefined) {
        this.$$cacheNoiseDecibelAverage = this.$$getDecibelAverage(this.$$noiseDecibelBuffer);
    }

    return this.$$cacheNoiseDecibelAverage;
};

Correlator.prototype.getSignalToNoiseRatio = function () {
    var
        signalDecibelAverage = this.getSignalDecibelAverage(),
        noiseDecibelAverage = this.getNoiseDecibelAverage(),
        signalToNoiseRatio = 0,
        isAbleToCompute;

    isAbleToCompute =
        signalDecibelAverage !== Correlator.NO_DECIBEL &&
        noiseDecibelAverage !== Correlator.NO_DECIBEL;

    if (isAbleToCompute) {
        signalToNoiseRatio = signalDecibelAverage - noiseDecibelAverage;
    }

    return signalToNoiseRatio;
};

Correlator.prototype.getCorrelationValue = function () {
    var i, lastIndexInSkipBlock, bufferIndex, data, code, result;

    if (this.$$cacheCorrelactionValue !== undefined) {
        return this.$$cacheCorrelactionValue;
    }

    result = 0;
    lastIndexInSkipBlock = this.$$skipFactor - 1;
    for (i = 0; i < this.$$code.length; i++) {
        bufferIndex = lastIndexInSkipBlock + i * this.$$skipFactor;
        data = this.$$dataBuffer.getItem(bufferIndex);
        if (data !== Correlator.NO_DATA) {
            code = this.$$code[i];
            result += data * code;
        }
    }

    this.$$cacheCorrelactionValue = result;

    return result;
};
