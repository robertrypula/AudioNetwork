var CarrierRecovery = (function () {
    'use strict';

    _CarrierRecovery.$inject = [];

    function _CarrierRecovery() {

        /*

        1ms

         */

        var
            CR,
            SAMPLE_HISTORY_PERIOD_LENGTH = 20;

        CR = function (samplesPerPeriod) {
            this.$$samplesPerPeriod = samplesPerPeriod;
            this.$$sampleCount = 0;
            this.$$sampleHistory = [];
            this.carrierReferenceReal;
            this.carrierReferenceImm;
            this.carrierAvgReal;
            this.carrierAvgImm;
            this.carrierPower;
            this.carrierPhase;
        };

        CR.prototype.$$computeReference = function () {
            var 
                omega = (2 * Math.PI) / this.$$samplesPerPeriod,
                x = omega * this.$$sampleCount;

            this.carrierReferenceReal = Math.cos(x);
            this.carrierReferenceImm = Math.sin(x);
        };

        CR.prototype.$$addToHistory = function (sample) {
            this.$$sampleHistory.push({
                sample: sample,
                sampleNumber: this.$$sampleCount,
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

            for (i = 0; i < n; i++) {
                sh = this.$$sampleHistory[i];
                this.carrierAvgReal += sh.carrierReal;
                this.carrierAvgImm += sh.carrierImm;
            }

            this.carrierAvgReal = this.carrierAvgReal / n;
            this.carrierAvgImm = this.carrierAvgImm / n;
        };

        CR.prototype.$$computePower = function () {
            this.carrierPower = 2.0 * Math.sqrt(
                this.carrierAvgReal * this.carrierAvgReal +
                this.carrierAvgImm * this.carrierAvgImm
            );
        };

        CR.prototype.$$computePhase = function () {
            this.carrierPhase = AudioUtil.findUnitAngle(this.carrierAvgReal, this.carrierAvgImm);

            // correct phase to start from positive side of X axis counterclockwise
            this.carrierPhase = this.carrierPhase - 0.25;
            if (this.carrierPhase < 0) {
                this.carrierPhase += 1;
            }
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
