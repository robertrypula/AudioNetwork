// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Correlator;

Correlator = function (skipFactor, code) {
    this.$$code = code
        ? code.slice(0)
        : Correlator.SYNC_CODE.slice(0);

    this.$$skipFactor = undefined;
    this.$$dataBuffer = undefined;
    this.$$signalDecibelBuffer = undefined;
    this.$$noiseDecibelBuffer = undefined;
    this.$$cacheCorrelactionValue = undefined;
    this.$$cacheSignalDecibelAverage = undefined;
    this.$$cacheNoiseDecibelAverage = undefined;

    this.setSkipFactor(skipFactor);
};

Correlator.SYNC_CODE = [1, -1, 1, -1, 1, -1];

Correlator.CORRELATION_POSITIVE = 'CORRELATION_POSITIVE';
Correlator.CORRELATION_NONE = 'CORRELATION_NONE';
Correlator.CORRELATION_NEGATIVE = 'CORRELATION_NEGATIVE';

Correlator.THRESHOLD = 0.9;
Correlator.NO_DECIBEL = null;
Correlator.NO_DATA = 0;

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
    this.$$dataBuffer = new Buffer(this.getCodeLength() * this.$$skipFactor);
    this.$$signalDecibelBuffer = new Buffer(this.getCodeLength() * this.$$skipFactor);
    this.$$noiseDecibelBuffer = new Buffer(this.getCodeLength() * this.$$skipFactor);
    this.$$cacheCorrelactionValue = undefined;
    this.$$cacheSignalDecibelAverage = undefined;
    this.$$cacheNoiseDecibelAverage = undefined;

    for (i = 0; i < this.getCodeLength() * this.$$skipFactor; i++) {
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

    // clear cache
    this.$$cacheCorrelactionValue = undefined;
    this.$$cacheSignalDecibelAverage = undefined;
    this.$$cacheNoiseDecibelAverage = undefined;
};

Correlator.prototype.getCorrelationValueThreshold = function () {
    return Math.floor(Correlator.THRESHOLD * this.getCodeLength());
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

Correlator.prototype.$$getDecibelAverage = function (buffer) {
    var i, offset, bufferIndex, value, sum, sumLength, average;

    sum = 0;
    sumLength = 0;
    offset = this.$$skipFactor - 1;
    for (i = 0; i < this.getCodeLength(); i++) {
        bufferIndex = i * this.$$skipFactor + offset;
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
        isAbleToCompute,
        signalToNoiseRatio;

    signalToNoiseRatio = 0;
    isAbleToCompute = signalDecibelAverage !== Correlator.NO_DECIBEL &&
        noiseDecibelAverage !== Correlator.NO_DECIBEL;
    if (isAbleToCompute) {
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
        if (data) {
            code = this.getCodeValue(i);
            result += data * code;
        }
    }

    this.$$cacheCorrelactionValue = result;

    return result;
};
