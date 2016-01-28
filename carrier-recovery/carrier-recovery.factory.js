var CarrierRecovery = (function () {
    'use strict';

    _CarrierRecovery.$inject = [];

    function _CarrierRecovery() {
        /*
        var
            CR,
            MINIMUM_BUFFER_PERIOD_LENGTH = 3,
            MINIMUM_BUFFER_LENGTH = (MINIMUM_BUFFER_PERIOD_LENGTH * 4) + 1;

        CR = function (samplesPerPeriod) {
            this.$$samplesPerPeriod = samplesPerPeriod;
            this.$$sampleCount = 0;
            this.minimumHistory = [];
            this.carrierStartSampleNumber = null;
            this.previousSquaredSample = 0;
            this.previousDifference = 0;
            this.previousCarrierStartSampleNumber = null;
            
            this.$$init();
        };

        CR.prototype.$$addMinimumEntry = function (difference, squaredSample, sampleNumber) {
            this.minimumHistory.push({
                difference: difference,
                squaredSample: squaredSample,
                sampleNumber: sampleNumber
            });

            if (this.minimumHistory.length > MINIMUM_BUFFER_LENGTH) {
                this.minimumHistory.splice(0, 1);
            }
        };

        CR.prototype.$$findCarrierStartSampleNumber = function () {
            var i, sampleNumber;

            sampleNumber = this.minimumHistory[0].sampleNumber;
            for (i = 0; i < this.minimumHistory.length; i++) {
                if (this.minimumHistory[i].squaredSample < 0.1) {
                    sampleNumber = this.minimumHistory[i].sampleNumber;
                    break;
                }
            }

            return sampleNumber;
        };

        CR.prototype.$$tryFindCarrier = function () {
            var i, error, errorTotal, sampleNumber, sampleNumberDiff, sampleNumberDiffExpected;

            if (this.minimumHistory.length !== MINIMUM_BUFFER_LENGTH) {
                return;
            }

            if (this.$$sampleCount - this.minimumHistory[MINIMUM_BUFFER_LENGTH - 1].sampleNumber > 3 * this.$$samplesPerPeriod) {
                this.carrierStartSampleNumber = null;
                this.previousCarrierStartSampleNumber = this.carrierStartSampleNumber;
                return;
            }

            sampleNumber = this.minimumHistory[0].sampleNumber;
            errorTotal = 0;
            for (i = 1; i < this.minimumHistory.length; i++) {
                sampleNumberDiff = this.minimumHistory[i].sampleNumber - sampleNumber;
                sampleNumberDiffExpected = 0.25 * this.$$samplesPerPeriod * i;
                error = Math.abs(sampleNumberDiffExpected - sampleNumberDiff) / (0.25 * this.$$samplesPerPeriod);
                errorTotal += error;
            }

            errorTotal = errorTotal / (this.minimumHistory.length - 1);

            if (errorTotal < 0.8) {
                if (this.previousCarrierStartSampleNumber === null) {
                    this.carrierStartSampleNumber = this.$$findCarrierStartSampleNumber();
                    console.log(this.carrierStartSampleNumber);
                }
            } else {
                this.carrierStartSampleNumber = null;
            }

            this.previousCarrierStartSampleNumber = this.carrierStartSampleNumber;
        };

        CR.prototype.carrierAvailable = function () {
            return this.carrierStartSampleNumber !== null;
        };

        CR.prototype.handleSample = function (sample) {
            var
                squaredSample = sample * sample,
                difference = squaredSample - this.previousSquaredSample;

            if (
                (difference >= 0 && this.previousDifference < 0) ||
                (difference <= 0 && this.previousDifference > 0)
            ) {
                this.$$addMinimumEntry(difference, squaredSample, this.$$sampleCount);
            }

            this.$$tryFindCarrier();

            this.previousSquaredSample = squaredSample;
            this.previousDifference = difference;
            this.$$sampleCount++;
        };

        CR.prototype.getCarrier = function () {
            var x;

            if (!this.carrierAvailable()) {
                return 0;
            }

            x = this.$$sampleCount - this.carrierStartSampleNumber;

            return Math.sin(2 * Math.PI * (x / this.$$samplesPerPeriod));
        };

        CR.prototype.$$init = function () {

        };
        */

        var
            CR,
            SAMPLE_HISTORY_PERIOD_LENGTH = 4;

        CR = function (samplesPerPeriod) {
            this.$$samplesPerPeriod = samplesPerPeriod;
            this.$$sampleCount = 0;
            this.carrierStartSampleNumber = samplesPerPeriod * 0.45;
            this.test = 0;

            this.$$sampleHistory = [];
            this.complexCarrierReal = 0;
            this.complexCarrierIm = 0;
            this.complexRealAvg = 0;
            this.complexImAvg = 0;

            this.$$init();
        };

        CR.prototype.computeComplexCarrier = function () {
            this.complexCarrierReal = Math.cos(2 * Math.PI * (this.$$sampleCount / this.$$samplesPerPeriod));
            this.complexCarrierIm = Math.sin(2 * Math.PI * (this.$$sampleCount / this.$$samplesPerPeriod));
        };

        CR.prototype.carrierAvailable = function () {
            // return this.carrierStartSampleNumber !== null;
            return true;
        };

        CR.prototype.$$addToHistory = function (sample) {
            var squaredSample = sample * sample;

            this.$$sampleHistory.push({
                squaredSample: squaredSample,
                sampleNumber: this.$$sampleCount,
                complexReal: this.complexCarrierReal * squaredSample,
                complexIm: this.complexCarrierIm * squaredSample
            });

            if (this.$$sampleHistory.length > SAMPLE_HISTORY_PERIOD_LENGTH * this.$$samplesPerPeriod) {
                this.$$sampleHistory.splice(0, 1);
            }
        };

        CR.prototype.computeComplexAverage = function () {
            var
                n = this.$$sampleHistory.length,
                sh,
                i;

            if (n === 0) {
                return;
            }
            this.complexRealAvg = 0;
            this.complexImAvg = 0;
            for (i = 0; i < n; i++) {
                sh = this.$$sampleHistory[i];
                this.complexRealAvg += sh.complexReal;
                this.complexImAvg += sh.complexIm;
            }

            this.complexRealAvg = this.complexRealAvg / n;
            this.complexImAvg = this.complexImAvg / n;
        };

        CR.prototype.handleSample = function (sample) {


            this.computeComplexCarrier();
            this.$$addToHistory(sample);
            this.computeComplexAverage();

            this.$$sampleCount++;
            this.test = 40 * Math.sqrt(this.complexRealAvg * this.complexRealAvg + this.complexImAvg * this.complexImAvg);
        };

        CR.prototype.getCarrier = function () {
            var x;

            if (!this.carrierAvailable()) {
                return 0;
            }

            // x = this.$$sampleCount - this.carrierStartSampleNumber;
            //return Math.sin(2 * Math.PI * (x / this.$$samplesPerPeriod));

            return this.test;
        };

        CR.prototype.$$init = function () {

        };

        return CR;
    }

    return _CarrierRecovery();        // TODO change it to dependency injection

})();
