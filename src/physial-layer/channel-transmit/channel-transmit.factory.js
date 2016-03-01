var ChannelTransmit = (function () {
    'use strict';

    _ChannelTransmit.$inject = [];

    function _ChannelTransmit() {
        var CT;
            
        CT = function (index, configuration) {
            this.scriptNode = null;
            this.gainNode = null;
            this.carrierGenerate = [];
            this.carrierFrequency = [];
            this.$$index = index;

            this.init();
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

        CT.prototype.getLastNode = function () {
            return this.gainNode;
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

        CT.prototype.init = function () {
            var self = this;

            this.scriptNode = Audio.createScriptProcessor(2 * 1024, 1, 1);
            this.scriptNode.onaudioprocess = function (audioProcessingEvent) {
                self.onAudioProcess(audioProcessingEvent);
            };

            this.gainNode = Audio.createGain();
            this.scriptNode.connect(this.gainNode);
        };

        CT.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                outputBuffer = audioProcessingEvent.outputBuffer,
                outputData = outputBuffer.getChannelData(0),
                sample,
                cg,
                i,
                j
            ;

            for (i = 0; i < outputBuffer.length; i++) {
                sample = 0;

                for (j = 0; j < this.carrierGenerate.length; j++) {
                    cg = this.carrierGenerate[j];

                    sample += cg.getSample();
                    cg.nextSample();
                }

                outputData[i] = sample;
                // outputData[i] += ((Math.random() * 2) - 1) * 0.1;
            }
        };

        CT.prototype.destroy = function () {
            this.scriptNode.disconnect(this.gainNode);
        };

        return CT;
    }

    return _ChannelTransmit();        // TODO change it to dependency injection

})();
