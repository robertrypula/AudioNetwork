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
            this.carrierReferenceBPSKIm;
            this.carrierReferenceReal;
            this.carrierReferenceIm;
            this.carrierAvgBPSKReal;
            this.carrierAvgBPSKIm;
            this.carrierAvgReal;
            this.carrierAvgIm;
            this.carrierPowerBPSK;
            this.carrierPower;
            this.carrierPhaseBPSK;
            this.carrierPhase;
        };

        CR.prototype.$$guessAngle = function (x, y) {
            return 0.0;
        };

        CR.prototype.$$computeReference = function () {
            var 
                omega = (2 * Math.PI) / this.$$samplesPerPeriod,
                x = omega * this.$$sampleCount;

            this.carrierReferenceBPSKReal = Math.cos(2 * x);
            this.carrierReferenceBPSKIm = Math.sin(2 * x);
            this.carrierReferenceReal = Math.cos(x);
            this.carrierReferenceIm = Math.sin(x);
        };

        CR.prototype.$$addToHistory = function (sample) {
            var sampleSquaredForBPSK = sample * sample;

            this.$$sampleHistory.push({
                sample: sample,
                sampleSquaredForBPSK: sampleSquaredForBPSK,
                sampleNumber: this.$$sampleCount,
                carrierBPSKReal: this.carrierReferenceBPSKReal * sampleSquaredForBPSK,
                carrierBPSKIm: this.carrierReferenceBPSKIm * sampleSquaredForBPSK,
                carrierReal: this.carrierReferenceReal * sample,
                carrierIm: this.carrierReferenceIm * sample
            });

            if (this.$$sampleHistory.length > SAMPLE_HISTORY_PERIOD_LENGTH * this.$$samplesPerPeriod) {
                this.$$sampleHistory.splice(0, 1);
            }
        };

        CR.prototype.$$computeAverage = function () {
            var n, sh, i;

            n = this.$$sampleHistory.length;
            this.carrierAvgReal = 0;
            this.carrierAvgIm = 0;
            this.carrierAvgBPSKReal = 0;
            this.carrierAvgBPSKIm = 0;

            for (i = 0; i < n; i++) {
                sh = this.$$sampleHistory[i];
                this.carrierAvgReal += sh.carrierReal;
                this.carrierAvgIm += sh.carrierIm;
                this.carrierAvgBPSKReal += sh.carrierBPSKReal;
                this.carrierAvgBPSKIm += sh.carrierBPSKIm;
            }

            this.carrierAvgReal = this.carrierAvgReal / n;
            this.carrierAvgIm = this.carrierAvgIm / n;
            this.carrierAvgBPSKReal = this.carrierAvgBPSKReal / n;
            this.carrierAvgBPSKIm = this.carrierAvgBPSKIm / n;
        };

        CR.prototype.$$computePower = function () {
            this.carrierPower = 2.0 * Math.sqrt(
                this.carrierAvgReal * this.carrierAvgReal +
                this.carrierAvgIm * this.carrierAvgIm
            );
            this.carrierPowerBPSK = 4 * Math.sqrt(
                this.carrierAvgBPSKReal * this.carrierAvgBPSKReal +
                this.carrierAvgBPSKIm * this.carrierAvgBPSKIm
            );
        };

        CR.prototype.$$computePhase = function () {
            this.carrierPhase = this.$$guessAngle(this.carrierAvgReal, this.carrierAvgIm);
            this.carrierPhaseBPSK = this.$$guessAngle(this.carrierAvgBPSKReal, this.carrierAvgBPSKIm);
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
            return this.carrierPower;
            //return this.carrierPowerBPSK;
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
