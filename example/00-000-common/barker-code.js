// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var BarkerCode;

BarkerCode = function (sampleFactor) {
    sampleFactor = sampleFactor || 1;

    this.$$sampleFactor;
    this.$$data;
    this.$$decibel;
    this.$$cacheCorrelactionValue;
    this.$$cacheDecibelAverage;

    this.setSampleFactor(sampleFactor);
};

BarkerCode.CODE_11 = [1, 1, 1, -1, -1, -1, 1, -1, -1, 1, -1];
BarkerCode.CORRELATION_RANK_POSITIVE_HIGH = 'CORRELATION_RANK_POSITIVE_HIGH';
BarkerCode.CORRELATION_RANK_POSITIVE = 'CORRELATION_RANK_POSITIVE';
BarkerCode.CORRELATION_RANK_NONE = 'CORRELATION_RANK_NONE';
BarkerCode.CORRELATION_RANK_NEGATIVE = 'CORRELATION_RANK_NEGATIVE';
BarkerCode.CORRELATION_RANK_NEGATIVE_HIGH = 'CORRELATION_RANK_NEGATIVE_HIGH';

BarkerCode.POSITION_OUT_OF_RANGE_EXCEPTION = 'Position out of range';
BarkerCode.MINUS_ONE_AS_ZERO = true;

BarkerCode.getCodeLength = function () {
    return BarkerCode.CODE_11.length;
};

BarkerCode.getCodeValue = function (position, minusOneAsZero) {
    var value;

    if (position < 0 || position >= BarkerCode.getCodeLength()) {
        throw BarkerCode.POSITION_OUT_OF_RANGE_EXCEPTION;
    }

    value = BarkerCode.CODE_11[position];
    if (minusOneAsZero === BarkerCode.MINUS_ONE_AS_ZERO && value === -1) {
        value = 0;
    }

    return value;
};

BarkerCode.prototype.setSampleFactor = function (sampleFactor) {
    this.$$sampleFactor = sampleFactor;
    this.$$data = new Buffer(BarkerCode.getCodeLength() *  this.$$sampleFactor);
    this.$$decibel = new Buffer(BarkerCode.getCodeLength() *  this.$$sampleFactor);
    this.$$cacheCorrelactionValue = null;
    this.$$cacheDecibelAverage = null;
};

BarkerCode.prototype.handle = function (isOne, decibel) {
    this.$$data.pushEvenIfFull(isOne ? 1 : -1);
    this.$$decibel.pushEvenIfFull(decibel);
    this.$$cacheCorrelactionValue = null;
    this.$$cacheDecibelAverage = null;
};

BarkerCode.prototype.getCorrelationRank = function () {
    var
        correlationValue = this.getCorrelationValue(),
        high = Math.floor(0.85 * BarkerCode.getCodeLength()),
        low = Math.floor(0.5 * BarkerCode.getCodeLength());

    if (correlationValue >= high) {
        return BarkerCode.CORRELATION_RANK_POSITIVE_HIGH;
    }

    if (correlationValue >= low) {
        return BarkerCode.CORRELATION_RANK_POSITIVE;
    }

    if (correlationValue > -low) {
        return BarkerCode.CORRELATION_RANK_NONE;
    }

    if (correlationValue > -high) {
        return BarkerCode.CORRELATION_RANK_NEGATIVE;
    }

    return BarkerCode.CORRELATION_RANK_NEGATIVE_HIGH;
};

BarkerCode.prototype.getDecibelAverage = function () {
    var enoughData, i, item, result;

    if (this.$$cacheDecibelAverage !== null) {
        return this.$$cacheDecibelAverage;
    }

    enoughData = this.$$decibel.getSize() === this.$$sampleFactor * BarkerCode.getCodeLength();

    if (enoughData) {
        result = 0;
        for (i = 0; i < BarkerCode.getCodeLength(); i++) {
            item = this.$$decibel.getItem(i * this.$$sampleFactor);
            result += item;
        }
        result /= BarkerCode.getCodeLength();
    } else {
        result = 0;
    }

    this.$$cacheDecibelAverage = result;

    return result;
};

BarkerCode.prototype.getCorrelationValue = function () {
    var enoughData, i, item, code, result;

    if (this.$$cacheCorrelactionValue !== null) {
        return this.$$cacheCorrelactionValue;
    }

    enoughData = this.$$data.getSize() === this.$$sampleFactor * BarkerCode.getCodeLength();

    if (enoughData) {
        result = 0;
        for (i = 0; i < BarkerCode.getCodeLength(); i++) {
            item = this.$$data.getItem(i * this.$$sampleFactor);
            code = BarkerCode.getCodeValue(i);
            result += item * code;
        }
    } else {
        result = 0;
    }

    this.$$cacheCorrelactionValue = result;

    return result;
};