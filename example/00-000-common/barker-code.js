// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var BarkerCode;

BarkerCode = function (sampleFactor) {
    this.setSampleFactor(sampleFactor);
};

BarkerCode.CODE_11 = [1, 1, 1, -1, -1, -1, 1, -1, -1, 1, -1];
BarkerCode.CORRELATION_RANK_POSITIVE_HIGH = 'CORRELATION_RANK_POSITIVE_HIGH';
BarkerCode.CORRELATION_RANK_POSITIVE = 'CORRELATION_RANK_POSITIVE';
BarkerCode.CORRELATION_RANK_NONE = 'CORRELATION_RANK_NONE';
BarkerCode.CORRELATION_RANK_NEGATIVE = 'CORRELATION_RANK_NEGATIVE';
BarkerCode.CORRELATION_RANK_NEGATIVE_HIGH = 'CORRELATION_RANK_NEGATIVE_HIGH';

BarkerCode.prototype.setSampleFactor = function (sampleFactor) {
    this.$$sampleFactor = sampleFactor;
    this.$$buffer = new Buffer(BarkerCode.CODE_11.length *  this.$$sampleFactor);
    this.$$cache = null;
};

BarkerCode.prototype.handle = function (isOne) {
    this.$$buffer.pushEvenIfFull(isOne ? 1 : -1);
    this.$$cache = null;
};

BarkerCode.prototype.getCorrelationRank = function () {
    var
        correlationValue = this.getCorrelationValue(),
        high = Math.floor(0.85 * BarkerCode.CODE_11.length), // <9, 11>
        low = Math.floor(0.5 * BarkerCode.CODE_11.length);    // <5, 9)

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

BarkerCode.prototype.getCorrelationValue = function () {
    var enoughData, i, item, code, result;

    if (this.$$cache !== null) {
        return this.$$cache;
    }

    enoughData = this.$$buffer.getSize() === this.$$sampleFactor * BarkerCode.CODE_11.length;

    if (enoughData) {
        result = 0;
        for (i = 0; i < BarkerCode.CODE_11.length; i++) {
            item = this.$$buffer.getItem(i * this.$$sampleFactor);
            code = BarkerCode.CODE_11[i];
            result += item * code;
        }
    } else {
        result = 0;
    }

    return result;
};