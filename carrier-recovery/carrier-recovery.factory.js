var CarrierRecovery = (function () {
    'use strict';

    _CarrierRecovery.$inject = [];

    function _CarrierRecovery() {
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

        CR.prototype.addMinimumEntry = function (difference, squaredSample, sampleNumber) {
            this.minimumHistory.push({
                difference: difference,
                squaredSample: squaredSample,
                sampleNumber: sampleNumber
            });

            if (this.minimumHistory.length > MINIMUM_BUFFER_LENGTH) {
                this.minimumHistory.splice(0, 1);
            }
        };

        CR.prototype.findCarrierStartSampleNumber = function () {
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

        CR.prototype.tryFindCarrier = function () {
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
                    this.carrierStartSampleNumber = this.findCarrierStartSampleNumber();
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
                this.addMinimumEntry(difference, squaredSample, this.$$sampleCount);
            }

            this.tryFindCarrier();

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

        return CR;
    }

    return _CarrierRecovery();        // TODO change it to dependency injection

})();
