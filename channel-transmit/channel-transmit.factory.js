var ChannelTransmit = (function () {
    'use strict';

    _ChannelTransmit.$inject = [];

    function _ChannelTransmit() {
        var CT;
            
        CT = function (configuration) {
            this.scriptNode = null;
            this.gainNode = null;
            this.carrierGenerate = [];

            this.init();
            this.configure(configuration);
        };

        CT.prototype.addToQueue = function (data) {
            var i;

            if (data.length !== this.carrierGenerate.length) {
                throw 'Wrong subcarriers size';
            }

            for (i = 0; i < this.carrierGenerate.length; i++) {
                this.carrierGenerate[i].addToQueue(data[i]);
            }
        };

        CT.prototype.getLastNode = function () {
            return this.gainNode;
        };

        CT.prototype.configure = function (configuration) {
            var i, cg;

            this.carrierGenerate.length = 0;
            for (i = 0; i < configuration.ofdmSize; i++) {
                cg = CarrierGenerateBuilder.build(
                    Audio.getSampleRate() /
                    (configuration.baseFrequency + i * configuration.ofdmFrequencySpacing)
                );
                this.carrierGenerate.push(cg);

            }
            console.log(this.carrierGenerate);
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
                i,
                j
            ;

            for (i = 0; i < outputBuffer.length; i++) {
                sample = 0;

                for (j = 0; j < this.carrierGenerate.length; j++) {
                    sample += this.carrierGenerate[j].getSample();
                    this.carrierGenerate[j].nextSample();
                }

                outputData[i] = sample;
                // outputData[i] += ((Math.random() * 2) - 1) * 0.2;
            }
        };

        CT.prototype.destroy = function () {
            this.scriptNode.disconnect(this.gainNode);
        };

        return CT;
    }

    return _ChannelTransmit();        // TODO change it to dependency injection

})();
