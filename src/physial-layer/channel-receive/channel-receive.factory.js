var ChannelReceive = (function () {
    'use strict';

    _ChannelReceive.$inject = [];

    function _ChannelReceive() {
        var CR;
            
        CR = function (index, configuration) {
            this.carrierRecovery = [];
            this.carrierFrequency = [];
            this.carrierPhaseCorrection = [];
            this.$$notifyInterval = null;
            this.$$notifyHandler = null;
            this.$$index = index;

            this.configure(configuration);
        };

        CR.prototype.configure = function (configuration) {
            var i, cr, samplePerPeriod, frequency;

            this.carrierRecovery.length = 0;
            for (i = 0; i < configuration.ofdmSize; i++) {
                frequency = configuration.baseFrequency + i * configuration.ofdmFrequencySpacing;
                samplePerPeriod = Audio.getSampleRate() / frequency;
                cr = CarrierRecoveryBuilder.build(samplePerPeriod, configuration.dftSize);
                this.carrierRecovery.push(cr);
                this.carrierFrequency.push(frequency);
                this.carrierPhaseCorrection.push(0);
            }

            this.$$notifyInterval = configuration.notifyInterval;
            this.$$notifyHandler = configuration.notifyHandler;
        };

        CR.prototype.$$checkOfdmIndex = function (ofdmIndex) {
            if (ofdmIndex < 0 || ofdmIndex >= this.carrierFrequency.length) {
                throw 'OFDM index out of range: ' + ofdmIndex;
            }
        };

        CR.prototype.getRxPhaseCorrection = function (ofdmIndex) {
            this.$$checkOfdmIndex(ofdmIndex);

            return this.carrierPhaseCorrection[ofdmIndex];
        };

        CR.prototype.getFrequency = function (ofdmIndex) {
            this.$$checkOfdmIndex(ofdmIndex);

            return this.carrierFrequency[ofdmIndex];
        };

        CR.prototype.setRxPhaseCorrection = function (ofdmIndex, phaseCorrection) {
            this.$$checkOfdmIndex(ofdmIndex);

            this.carrierPhaseCorrection[ofdmIndex] = phaseCorrection - Math.floor(phaseCorrection);
        };

        CR.prototype.setFrequency = function (ofdmIndex, frequency) {
            var samplePerPeriod;

            this.$$checkOfdmIndex(ofdmIndex);

            samplePerPeriod = Audio.getSampleRate() / frequency;
            this.carrierRecovery[ofdmIndex].setSamplePerPeriod(samplePerPeriod);
            this.carrierFrequency[ofdmIndex] = frequency;
        };

        CR.prototype.handleSample = function (sample, sampleNumber) {
            var notifyIteration, cr, c, i, carrierData;

            notifyIteration = (sampleNumber % this.$$notifyInterval === 0);

            if (notifyIteration) {
                carrierData = [];
            }

            for (i = 0; i < this.carrierRecovery.length; i++) {
                cr = this.carrierRecovery[i];
                cr.handleSample(sample);
                if (notifyIteration) {
                    c = cr.getCarrier();
                    c.phase = c.phase - this.carrierPhaseCorrection[i];
                    c.phase = c.phase - MathUtil.floor(c.phase);
                    carrierData.push(c);
                }
            }

            if (notifyIteration) {
                this.$$notifyHandler(this.$$index, carrierData);
            }
        };

        CR.prototype.destroy = function () {
            this.carrierRecovery.length = 0;
            this.carrierFrequency.length = 0;
            this.carrierPhaseCorrection.length = 0;
        };

        return CR;
    }

    return _ChannelReceive();        // TODO change it to dependency injection

})();