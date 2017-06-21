// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Correlator;

Correlator = function (skipFactor, code) {
    this.$$code = code
        ? code.slice(0)
        : Correlator.SYNC_CODE.slice(0);
    this.$$skipFactor;
    this.$$dataBuffer;
    this.$$decibelBuffer;
    this.$$cacheCorrelactionValue;
    this.$$cacheDecibelAverage;

    this.setSampleFactor(skipFactor);
};

Correlator.BARKER_CODE_11 = [1, 1, 1, -1, -1, -1, 1, -1, -1, 1, -1];
Correlator.SYNC_CODE = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1];

Correlator.CORRELATION_RANK_POSITIVE_HIGH = 'CORRELATION_RANK_POSITIVE_HIGH';
Correlator.CORRELATION_RANK_POSITIVE = 'CORRELATION_RANK_POSITIVE';
Correlator.CORRELATION_RANK_NONE = 'CORRELATION_RANK_NONE';
Correlator.CORRELATION_RANK_NEGATIVE = 'CORRELATION_RANK_NEGATIVE';
Correlator.CORRELATION_RANK_NEGATIVE_HIGH = 'CORRELATION_RANK_NEGATIVE_HIGH';

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

Correlator.prototype.setSampleFactor = function (skipFactor) {
    skipFactor = skipFactor || 1;

    this.$$skipFactor = skipFactor;
    this.$$dataBuffer = new Buffer(this.getCodeLength() *  this.$$skipFactor);
    this.$$decibelBuffer = new Buffer(this.getCodeLength() *  this.$$skipFactor);
    this.$$cacheCorrelactionValue = undefined;
    this.$$cacheDecibelAverage = undefined;
};

Correlator.prototype.handle = function (dataLogicValue, decibel) {
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
    this.$$decibelBuffer.pushEvenIfFull(
        data === null ? null : decibel
    );
    this.$$cacheCorrelactionValue = undefined;
    this.$$cacheDecibelAverage = undefined;
};

Correlator.prototype.getCorrelationRank = function () {
    var
        correlationValue = this.getCorrelationValue(),
        high = Math.floor(0.85 * this.getCodeLength()),
        low = Math.floor(0.5 * this.getCodeLength());

    if (correlationValue >= high) {
        return Correlator.CORRELATION_RANK_POSITIVE_HIGH;
    }

    if (correlationValue >= low) {
        return Correlator.CORRELATION_RANK_POSITIVE;
    }

    if (correlationValue > -low) {
        return Correlator.CORRELATION_RANK_NONE;
    }

    if (correlationValue > -high) {
        return Correlator.CORRELATION_RANK_NEGATIVE;
    }

    return Correlator.CORRELATION_RANK_NEGATIVE_HIGH;
};

Correlator.prototype.getDecibelAverage = function () {
    var enoughData, i, decibel, result, decibelLength;

    if (this.$$cacheDecibelAverage !== undefined) {
        return this.$$cacheDecibelAverage;
    }

    result = 0;
    decibelLength = 0;
    enoughData = this.$$decibelBuffer.getSize() === this.$$skipFactor * this.getCodeLength();
    if (enoughData) {
        for (i = 0; i < this.getCodeLength(); i++) {
            decibel = this.$$decibelBuffer.getItem(i * this.$$skipFactor);
            if (decibel !== null) {
                result += decibel;
                decibelLength++;
            }
        }
        if (decibelLength > 1) {
            result /= decibelLength;
        }
    }
    this.$$cacheDecibelAverage = result;

    return result;
};

Correlator.prototype.getCorrelationValue = function () {
    var enoughData, i, data, code, result;

    if (this.$$cacheCorrelactionValue !== undefined) {
        return this.$$cacheCorrelactionValue;
    }

    result = 0;
    enoughData = this.$$dataBuffer.getSize() === this.$$skipFactor * this.getCodeLength();
    if (enoughData) {
        for (i = 0; i < this.getCodeLength(); i++) {
            data = this.$$dataBuffer.getItem(i * this.$$skipFactor);
            if (data !== null) {
                code = this.getCodeValue(i);
                result += data * code;
            }
        }
    }
    this.$$cacheCorrelactionValue = result;

    return result;
};