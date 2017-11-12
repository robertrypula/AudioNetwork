// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.Complex', _Complex);

    _Complex.$inject = [
        'Common.Util',
        'Common.MathUtil'
    ];

    function _Complex(
        Util,
        MathUtil
    ) {
        var Complex;

        Complex = function (real, imm) {
            this.real = real;
            this.imm = imm;
        };

        Complex.prototype.add = function (complex) {
            this.real += complex.real;
            this.imm += complex.imm;
        };

        Complex.prototype.sub = function (complex) {
            this.real -= complex.real;
            this.imm -= complex.imm;
        };

        Complex.prototype.mulScalar = function (n) {
            this.real *= n;
            this.imm *= n;
        };

        Complex.prototype.divScalar = function (n) {
            this.real /= n;
            this.imm /= n;
        };

        Complex.prototype.getAbsoluteValue = function () {
            return MathUtil.sqrt(
                this.real * this.real +
                this.imm * this.imm
            );
        };

        Complex.prototype.findUnitAngle = function () {
            return Util.findUnitAngle(this.real, this.imm);
        };

        return Complex;
    }

})();
