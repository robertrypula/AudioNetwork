var CarrierRecovery = (function () {
    'use strict';

    _CarrierRecovery.$inject = [];

    function _CarrierRecovery() {
        var CR;

        CR = function (samplesPerPeriod) {
            this.$$samplesPerPeriod = samplesPerPeriod;
            this.$$sample = 0;
            
            this.$$init();
        };

        CR.prototype.carrierAvailable = function () {
            return true;
        };

        CR.prototype.handleSample = function (sample) {
            this.$$sample = sample;
        };

        CR.prototype.getCarrier = function () {
            return this.$$sample * this.$$sample;
        };

        CR.prototype.$$init = function () {

        };

        return CR;
    }

    return _CarrierRecovery();        // TODO change it to dependency injection

})();
