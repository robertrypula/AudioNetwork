// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Correlator;

Correlator = function (skipFactor, code) {
    this.$$code = code
        ? code.slice(0)
        : Correlator.SYNC_CODE.slice(0);
    this.$$skipFactor;
    this.$$dataBuffer;
    this.$$signalDecibelBuffer;
    this.$$noiseDecibelBuffer;
    this.$$cacheCorrelactionValue;
    this.$$cacheSignalDecibelAverage;
    this.$$cacheNoiseDecibelAverage;

    this.setSkipFactor(skipFactor);
};

Correlator.SYNC_CODE = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1];

Correlator.CORRELATION_POSITIVE_HIGH = 'CORRELATION_POSITIVE_HIGH';
Correlator.CORRELATION_POSITIVE_LOW = 'CORRELATION_POSITIVE_LOW';
Correlator.CORRELATION_NONE = 'CORRELATION_NONE';
Correlator.CORRELATION_NEGATIVE_LOW = 'CORRELATION_NEGATIVE_LOW';
Correlator.CORRELATION_NEGATIVE_HIGH = 'CORRELATION_NEGATIVE_HIGH';

Correlator.THRESHOLD_HIGH = 0.8;
Correlator.THRESHOLD_LOW = 0.5;

Correlator.POSITION_OUT_OF_RANGE_EXCEPTION = 'Position out of range';

Correlator.prototype.getCodeLength = function () {
    return this.$$code.length;
};

Correlator.prototype.getCodeValue = function (position) {
    if (position < 0 || position >= this.getCodeLength()) {
        throw Correlator.POSITION_OUT_OF_RANGE_EXCEPTION;
    }

    return this.$$code[position];
};

Correlator.prototype.reset = function () {
    this.setSkipFactor(this.$$skipFactor);     // setting skip factor is like reset
};

Correlator.prototype.setSkipFactor = function (skipFactor) {
    var i;

    skipFactor = skipFactor || 1;

    this.$$skipFactor = skipFactor;
    this.$$dataBuffer = new Buffer(this.getCodeLength() *  this.$$skipFactor);
    this.$$signalDecibelBuffer = new Buffer(this.getCodeLength() *  this.$$skipFactor);
    this.$$noiseDecibelBuffer = new Buffer(this.getCodeLength() *  this.$$skipFactor);
    this.$$cacheCorrelactionValue = undefined;
    this.$$cacheSignalDecibelAverage = undefined;
    this.$$cacheNoiseDecibelAverage = undefined;

    for (i = 0; i < this.getCodeLength() * this.$$skipFactor; i++) {
        this.$$dataBuffer.pushEvenIfFull(null);
        this.$$signalDecibelBuffer.pushEvenIfFull(null);
        this.$$noiseDecibelBuffer.pushEvenIfFull(null);
    }
};

Correlator.prototype.handle = function (dataLogicValue, signalDecibel, noiseDecibel) {
    var data;

    data = null;
    switch (dataLogicValue) {
        case true:
            data = 1;
            break;
        case false:
            data = -1;
            break;
    }
    this.$$dataBuffer.pushEvenIfFull(data);
    this.$$signalDecibelBuffer.pushEvenIfFull(
        data === null ? null : signalDecibel
    );
    this.$$noiseDecibelBuffer.pushEvenIfFull(
        data === null ? null : noiseDecibel
    );
    this.$$cacheCorrelactionValue = undefined;
    this.$$cacheSignalDecibelAverage = undefined;
    this.$$cacheNoiseDecibelAverage = undefined;
};

Correlator.prototype.getCorrelationValueThresholdHigh = function () {
    return Math.floor(Correlator.THRESHOLD_HIGH * this.getCodeLength());
};

Correlator.prototype.getCorrelationValueThresholdLow = function () {
    return Math.floor(Correlator.THRESHOLD_LOW * this.getCodeLength());
};

Correlator.prototype.isCorrelatedHigh = function () {
    var correlation = this.getCorrelation();

    return (
        correlation === Correlator.CORRELATION_NEGATIVE_HIGH ||
        correlation === Correlator.CORRELATION_POSITIVE_HIGH
    );
};

Correlator.prototype.getCorrelation = function () {
    var
        correlationValue = this.getCorrelationValue(),
        high = this.getCorrelationValueThresholdHigh(),
        low = this.getCorrelationValueThresholdLow();

    if (correlationValue >= high) {
        return Correlator.CORRELATION_POSITIVE_HIGH;
    }

    if (correlationValue >= low) {
        return Correlator.CORRELATION_POSITIVE_LOW;
    }

    if (correlationValue > -low) {
        return Correlator.CORRELATION_NONE;
    }

    if (correlationValue > -high) {
        return Correlator.CORRELATION_NEGATIVE_LOW;
    }

    return Correlator.CORRELATION_NEGATIVE_HIGH;
};

Correlator.prototype.$$getAverage = function (buffer) {
    var i, offset, bufferIndex, value, sum, sumLength, average;

    sum = 0;
    sumLength = 0;
    offset = this.$$skipFactor - 1;
    for (i = 0; i < this.getCodeLength(); i++) {
        bufferIndex = i * this.$$skipFactor + offset;
        value = buffer.getItem(bufferIndex);
        if (value !== null) {
            sum += value;
            sumLength++;
        }
    }

    average = (sumLength > 0)
        ? sum / sumLength
        : null;

    return average;
};

Correlator.prototype.getSignalDecibelAverage = function () {
    if (this.$$cacheSignalDecibelAverage === undefined) {
        this.$$cacheSignalDecibelAverage = this.$$getAverage(this.$$signalDecibelBuffer);
    }

    return this.$$cacheSignalDecibelAverage;
};

Correlator.prototype.getNoiseDecibelAverage = function () {
    if (this.$$cacheNoiseDecibelAverage === undefined) {
        this.$$cacheNoiseDecibelAverage = this.$$getAverage(this.$$noiseDecibelBuffer);
    }

    return this.$$cacheNoiseDecibelAverage;
};

Correlator.prototype.getSignalToNoiseRatio = function () {
    var
        signalDecibelAverage = this.getSignalDecibelAverage(),
        noiseDecibelAverage = this.getNoiseDecibelAverage(),
        signalToNoiseRatio;

    signalToNoiseRatio = 0;
    if (signalDecibelAverage !== null && noiseDecibelAverage !== null) {
        signalToNoiseRatio = signalDecibelAverage - noiseDecibelAverage;
    }

    return signalToNoiseRatio;
};

Correlator.prototype.getCorrelationValue = function () {
    var i, offset, bufferIndex, data, code, result;

    if (this.$$cacheCorrelactionValue !== undefined) {
        return this.$$cacheCorrelactionValue;
    }

    result = 0;
    offset = this.$$skipFactor - 1;
    for (i = 0; i < this.getCodeLength(); i++) {
        bufferIndex = i * this.$$skipFactor + offset;
        data = this.$$dataBuffer.getItem(bufferIndex);
        if (data !== null) {
            code = this.getCodeValue(i);
            result += data * code;
        }
    }

    this.$$cacheCorrelactionValue = result;

    return result;
};