var ChannelReceive = (function () {
    'use strict';

    _ChannelReceive.$inject = [];

    function _ChannelReceive() {
        var CR;
            
        CR = function (index, configuration) {
            this.carrierRecovery = [];
            this.carrierFrequency = [];
            this.$$notifyInterval = null;
            this.$$notifyHandler = null;
            this.$$index = index;
            this.$$phaseCorrection = 0;

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
            }

            this.$$notifyInterval = configuration.notifyInterval;
            this.$$notifyHandler = configuration.notifyHandler;
        };

        CR.prototype.getFrequency = function (ofdmIndex) {
            if (ofdmIndex < 0 || ofdmIndex >= this.carrierFrequency.length) {
                throw 'OFDM index out of range: ' + ofdmIndex;
            }

            return this.carrierFrequency[ofdmIndex];
        };

        CR.prototype.setRxPhaseCorrection = function (ofdmIndex, phaseCorrection) {
            if (ofdmIndex < 0 || ofdmIndex >= this.carrierFrequency.length) {
                throw 'OFDM index out of range: ' + ofdmIndex;
            }

            this.$$phaseCorrection = phaseCorrection - Math.floor(phaseCorrection);
        };

        CR.prototype.setFrequency = function (ofdmIndex, frequency) {
            var samplePerPeriod;

            if (ofdmIndex < 0 || ofdmIndex >= this.carrierFrequency.length) {
                throw 'OFDM index out of range: ' + ofdmIndex;
            }

            samplePerPeriod = Audio.getSampleRate() / frequency;
            this.carrierRecovery[ofdmIndex].setSamplePerPeriod(samplePerPeriod);
            this.carrierFrequency[ofdmIndex] = frequency;
        };

        CR.prototype.handleSample = function (sample, sampleNumber) {
            var notifyIteration, cr, i, carrierData;

            notifyIteration = (sampleNumber % this.$$notifyInterval === 0);

            if (notifyIteration) {
                carrierData = [];
            }

            for (i = 0; i < this.carrierRecovery.length; i++) {
                cr = this.carrierRecovery[i];
                cr.handleSample(sample);
                if (notifyIteration) {
                    carrierData.push(cr.getCarrier());
                }
            }

            if (notifyIteration) {
                this.$$notifyHandler(this.$$index, carrierData);
            }
        };

        CR.prototype.destroy = function () {
            this.carrierRecovery.length = 0;
            this.carrierFrequency.length = 0;
        };

        return CR;
    }

    return _ChannelReceive();        // TODO change it to dependency injection

})();
