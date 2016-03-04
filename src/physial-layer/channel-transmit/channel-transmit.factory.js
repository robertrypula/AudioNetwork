var ChannelTransmit = (function () {
    'use strict';

    _ChannelTransmit.$inject = [];

    function _ChannelTransmit() {
        var CT;
            
        CT = function (index, configuration) {
            this.carrierGenerate = [];
            this.carrierFrequency = [];
            this.$$index = index;

            this.configure(configuration);
        };

        CT.prototype.addToQueue = function (data) {
            var i;

            if (data.length !== this.carrierGenerate.length) {
                throw 'Data array length does not match configures OFDM size';
            }

            for (i = 0; i < this.carrierGenerate.length; i++) {
                this.carrierGenerate[i].addToQueue(data[i]);
            }
        };

        CT.prototype.getFrequency = function (ofdmIndex) {
            if (ofdmIndex < 0 || ofdmIndex >= this.carrierFrequency.length) {
                throw 'OFDM index out of range: ' + ofdmIndex;
            }

            return this.carrierFrequency[ofdmIndex];
        };

        CT.prototype.setFrequency = function (ofdmIndex, frequency) {
            var samplePerPeriod;

            if (ofdmIndex < 0 || ofdmIndex >= this.carrierFrequency.length) {
                throw 'OFDM index out of range: ' + ofdmIndex;
            }

            samplePerPeriod = Audio.getSampleRate() / frequency;
            this.carrierGenerate[ofdmIndex].setSamplePerPeriod(samplePerPeriod);
            this.carrierFrequency[ofdmIndex] = frequency;
        };

        CT.prototype.configure = function (configuration) {
            var i, cg, samplePerPeriod, frequency;

            this.carrierGenerate.length = 0;
            for (i = 0; i < configuration.ofdmSize; i++) {
                frequency = configuration.baseFrequency + i * configuration.ofdmFrequencySpacing;
                samplePerPeriod = Audio.getSampleRate() / frequency;
                cg = CarrierGenerateBuilder.build(samplePerPeriod);
                this.carrierGenerate.push(cg);
                this.carrierFrequency.push(frequency);
            }
        };

        CT.prototype.getSample = function () {
            var sample, cg, i;

            sample = 0;
            for (i = 0; i < this.carrierGenerate.length; i++) {
                cg = this.carrierGenerate[i];
                sample += cg.getSample();
                cg.nextSample();
            }

            return sample;
        };

        CT.prototype.destroy = function () {
            this.carrierGenerate.length = 0;
            this.carrierFrequency.length = 0;
        };

        return CT;
    }

    return _ChannelTransmit();        // TODO change it to dependency injection

})();
