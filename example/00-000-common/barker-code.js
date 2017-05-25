// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var BarkerCode;

BarkerCode = function () {
    this.$$buffer = new Buffer(11 *  2);
};

BarkerCode.CODE_11 = [1, 1, 1, -1, -1, -1, 1, -1, -1, 1, -1];

BarkerCode.prototype.handle = function (isOne) {
    this.$$buffer.pushEvenIfFull(isOne ? 1 : -1);
};

BarkerCode.prototype.getCorrelationValue = function () {
    var i, item, code, result, log;

    if (this.$$buffer.getSize() === 2 * BarkerCode.CODE_11.length) {
        result = 0;
        log = '';
        for (i = 0; i < BarkerCode.CODE_11.length; i++) {
            item = this.$$buffer.getItem(i * 2);
            code = BarkerCode.CODE_11[i];
            log += (item >= 0 ? '+' : '') + item + '*' + (code >= 0 ? '+' : '') + code + ' + ';
            result += item * code;
        }
        console.log('corr ', log, result);
    } else {
        result = 0;
    }

    return result;
};