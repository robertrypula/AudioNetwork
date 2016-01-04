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

        CR.prototype.tryFindCarrier = function () {
            var i, error, errorTotal, sampleNumber, sampleNumberDiff, sampleNumberDiffExpected;

            this.carrierStartSampleNumber = null;
            if (this.minimumHistory.length !== MINIMUM_BUFFER_LENGTH) {
                return;
            }

            // if (this.$$sampleCount - this.minimumHistory[MINIMUM_BUFFER_LENGTH - 1].sampleNumber)

            sampleNumber = this.minimumHistory[0].sampleNumber;
            errorTotal = 0;
            for (i = 1; i < this.minimumHistory.length; i++) {
                sampleNumberDiff = this.minimumHistory[i].sampleNumber - sampleNumber;
                sampleNumberDiffExpected = 0.5 * this.$$samplesPerPeriod * i;
                error = Math.abs(sampleNumberDiffExpected - sampleNumberDiff);

                errorTotal += error;
            }

            this.carrierStartSampleNumber = errorTotal;
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

            return this.carrierStartSampleNumber;

            return Math.sin(2 * Math.PI * (x / this.$$samplesPerPeriod));
        };

        CR.prototype.$$init = function () {

        };

        return CR;
    }

    return _CarrierRecovery();        // TODO change it to dependency injection

})();
