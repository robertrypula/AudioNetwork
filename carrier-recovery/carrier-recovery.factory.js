var CarrierRecovery = (function () {
    'use strict';

    _CarrierRecovery.$inject = [];

    function _CarrierRecovery() {
        var CR;

        CR = function (samplePerPeriod, sizeDFT) {
            this.$$sizeDFT = sizeDFT;
            this.$$sampleNumber = 0;
            this.$$history = [];
            this.$$referenceReal = 0;
            this.$$referenceImm = 0;
            this.$$real = 0;
            this.$$imm = 0;
            this.$$power = 0;
            this.$$powerDecibel = 0;
            this.$$phase = 0;
            this.$$samplePerPeriod = null;
            this.$$omega = null;
            this.setSamplePerPeriod(samplePerPeriod);
        };

        CR.prototype.$$computeReference = function () {
            var x = this.$$omega * this.$$sampleNumber;

            this.$$referenceReal = Math.cos(x);
            this.$$referenceImm = Math.sin(x);
        };

        CR.prototype.$$addToHistory = function (sample) {
            this.$$history.push({
                sample: sample,
                sampleNumber: this.$$sampleNumber,
                real: this.$$referenceReal * sample,
                imm: this.$$referenceImm * sample
            });

            if (this.$$history.length > this.$$sizeDFT) {
                this.$$history.splice(0, 1);
            }
        };

        CR.prototype.$$computeAverage = function () {
            var n, history, i;

            // TODO Implement windowing, compute values only at overlapping ends of each window
            // TODO not per each sample. This will increase performance.

            n = this.$$history.length;
            this.$$real = 0;
            this.$$imm = 0;

            for (i = 0; i < n; i++) {
                history = this.$$history[i];
                this.$$real += history.real;
                this.$$imm += history.imm;
            }

            this.$$real = this.$$real / n;
            this.$$imm = this.$$imm / n;
        };

        CR.prototype.$$computePower = function () {
            this.$$power = Math.sqrt(
                this.$$real * this.$$real +
                this.$$imm * this.$$imm
            );
            this.$$powerDecibel = 10 * Math.log(this.$$power) / Math.LN10;
        };

        CR.prototype.$$computePhase = function () {
            this.$$phase = AudioUtil.findUnitAngle(this.$$real, this.$$imm);

            // correct phase to start from positive side of X axis counterclockwise
            this.$$phase = this.$$phase - 0.25;
            if (this.$$phase < 0) {
                this.$$phase += 1;
            }
        };

        CR.prototype.handleSample = function (sample) {
            this.$$computeReference();
            this.$$addToHistory(sample);
            this.$$computeAverage();
            this.$$computePower();
            this.$$computePhase();

            this.$$sampleNumber++;
        };

        CR.prototype.getCarrier = function () {
            return {
                phase: this.$$phase,
                power: this.$$power,
                powerDecibel: this.$$powerDecibel,
                real: this.$$real,
                imm: this.$$imm
            };
        };

        CR.prototype.setSamplePerPeriod = function (samplePerPeriod) {
            this.$$samplePerPeriod = samplePerPeriod;
            this.$$omega = (2 * Math.PI) / this.$$samplePerPeriod;  // revolutions per sample
            this.$$history.length = 0;
            this.$$sampleNumber = 0;
        };

        CR.prototype.setSizeDFT = function (sizeDFT) {
            this.$$sizeDFT = sizeDFT;
            this.$$history.length = 0;
            this.$$sampleNumber = 0;
        };

        return CR;
    }

    return _CarrierRecovery();        // TODO change it to dependency injection

})();
