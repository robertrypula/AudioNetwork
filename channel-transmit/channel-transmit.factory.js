var ChannelTransmit = (function () {
    'use strict';

    _ChannelTransmit.$inject = [];

    function _ChannelTransmit() {
        var CT;
            
        CT = function (frequency) {
            this.scriptNode = null;
            this.gainNode = null;
            this.carrierGenerate = CarrierGenerateBuilder.build(
                Audio.getSampleRate() / frequency
            );

            this.init();
        };

        CT.prototype.addToQueue = function (data) {
            this.carrierGenerate.addToQueue(data);
        };

        CT.prototype.getLastNode = function () {
            return this.gainNode;
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
                outputData,
                sample,
                i
            ;

            outputData = outputBuffer.getChannelData(0);
            for (i = 0; i < outputBuffer.length; i++) {
                sample = this.carrierGenerate.getSample();
                this.carrierGenerate.nextSample();

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
