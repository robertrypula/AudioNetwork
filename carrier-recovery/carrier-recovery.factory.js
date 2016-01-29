var CarrierRecovery = (function () {
    'use strict';

    _CarrierRecovery.$inject = [];

    function _CarrierRecovery() {

        var
            CR,
            SAMPLE_HISTORY_PERIOD_LENGTH = 3;

        CR = function (samplesPerPeriod) {
            this.$$samplesPerPeriod = samplesPerPeriod;
            this.$$sampleCount = 0;
            this.$$sampleHistory = [];
            this.carrierReferenceBPSKReal;
            this.carrierReferenceBPSKImm;
            this.carrierReferenceReal;
            this.carrierReferenceImm;
            this.carrierAvgBPSKReal;
            this.carrierAvgBPSKImm;
            this.carrierAvgReal;
            this.carrierAvgImm;
            this.carrierPowerBPSK;
            this.carrierPower;
            this.carrierPhaseBPSK;
            this.carrierPhase;
        };

        CR.prototype.$$findUnitAngle = function (x, y) {
            var length, q, angle;

            length = Math.sqrt(x * x + y * y);
            length = (length < 0.000001) ? 0.000001 : length;    // prevents from dividing by zero
            q = (y >= 0) ? (x >= 0 ? 0 : 1) : (x < 0 ? 2 : 3);
            switch (q) {
                case 0:
                    angle = Math.asin(y / length);
                    break;
                case 1:
                    angle = Math.asin(-x / length) + 0.5 * Math.PI;
                    break;
                case 2:
                    angle = Math.asin(-y / length) + Math.PI;
                    break;
                case 3:
                    angle = Math.asin(x / length) + 1.5 * Math.PI;
                    break;
            }

            return angle / (2 * Math.PI);
        };

        CR.prototype.$$computeReference = function () {
            var 
                omega = (2 * Math.PI) / this.$$samplesPerPeriod,
                x = omega * this.$$sampleCount;

            this.carrierReferenceBPSKReal = Math.cos(2 * x);
            this.carrierReferenceBPSKImm = Math.sin(2 * x);
            this.carrierReferenceReal = Math.cos(x);
            this.carrierReferenceImm = Math.sin(x);
        };

        CR.prototype.$$addToHistory = function (sample) {
            var sampleSquaredForBPSK = sample * sample;

            this.$$sampleHistory.push({
                sample: sample,
                sampleSquaredForBPSK: sampleSquaredForBPSK,
                sampleNumber: this.$$sampleCount,
                carrierBPSKReal: this.carrierReferenceBPSKReal * sampleSquaredForBPSK,
                carrierBPSKImm: this.carrierReferenceBPSKImm * sampleSquaredForBPSK,
                carrierReal: this.carrierReferenceReal * sample,
                carrierImm: this.carrierReferenceImm * sample
            });

            if (this.$$sampleHistory.length > SAMPLE_HISTORY_PERIOD_LENGTH * this.$$samplesPerPeriod) {
                this.$$sampleHistory.splice(0, 1);
            }
        };

        CR.prototype.$$computeAverage = function () {
            var n, sh, i;

            n = this.$$sampleHistory.length;
            this.carrierAvgReal = 0;
            this.carrierAvgImm = 0;
            this.carrierAvgBPSKReal = 0;
            this.carrierAvgBPSKImm = 0;

            for (i = 0; i < n; i++) {
                sh = this.$$sampleHistory[i];
                this.carrierAvgReal += sh.carrierReal;
                this.carrierAvgImm += sh.carrierImm;
                this.carrierAvgBPSKReal += sh.carrierBPSKReal;
                this.carrierAvgBPSKImm += sh.carrierBPSKImm;
            }

            this.carrierAvgReal = this.carrierAvgReal / n;
            this.carrierAvgImm = this.carrierAvgImm / n;
            this.carrierAvgBPSKReal = this.carrierAvgBPSKReal / n;
            this.carrierAvgBPSKImm = this.carrierAvgBPSKImm / n;
        };

        CR.prototype.$$computePower = function () {
            this.carrierPower = 2.0 * Math.sqrt(
                this.carrierAvgReal * this.carrierAvgReal +
                this.carrierAvgImm * this.carrierAvgImm
            );
            this.carrierPowerBPSK = 4 * Math.sqrt(
                this.carrierAvgBPSKReal * this.carrierAvgBPSKReal +
                this.carrierAvgBPSKImm * this.carrierAvgBPSKImm
            );
        };

        CR.prototype.$$computePhase = function () {
            this.carrierPhase = this.$$findUnitAngle(this.carrierAvgReal, this.carrierAvgImm);
            this.carrierPhaseBPSK = this.$$findUnitAngle(this.carrierAvgBPSKReal, this.carrierAvgBPSKImm);
        };

        CR.prototype.handleSample = function (sample) {
            this.$$computeReference();
            this.$$addToHistory(sample);
            this.$$computeAverage();
            this.$$computePower();
            this.$$computePhase();

            this.$$sampleCount++;
        };

        CR.prototype.carrierAvailable = function () {
            return true;
        };

        CR.prototype.getCarrier = function () {
            return {
                phase: this.carrierPhase,
                power: this.carrierPower,
                powerBPSK: this.carrierPowerBPSK,
                avgReal: this.carrierAvgReal,
                avgImm: this.carrierAvgImm
            };
        };

        CR.prototype.setSamplesPerPeriod = function (samplesPerPeriod) {
            this.$$samplesPerPeriod = samplesPerPeriod;
            this.$$sampleHistory.length = 0;
            this.$$sampleCount = 0;
        };

        return CR;
    }

    return _CarrierRecovery();        // TODO change it to dependency injection

})();
