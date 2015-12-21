var ChannelReceive = (function () {
    'use strict';

    _ChannelReceive.$inject = [];

    function _ChannelReceive() {
        var CR;
            
        CR = function (frequency) {
            this.scriptNode = null;
            this.filterNode = null;
            this.gainNode = null;
            this.sampleCount = 0;
            this.filterActive = true;

            // TODO add analyser
            // change order of filter

            this.init(frequency);
        };

        CR.prototype.filterToggle = function () {
            if (this.filterActive) {
                this.filterDisable();
            } else {
                this.filterEnable();
            }
        };

        CR.prototype.filterEnable = function () {
            if (this.filterActive === true) {
                return;
            }
            this.filterActive = true;
            this.scriptNode.disconnect(this.gainNode);
            this.scriptNode.connect(this.filterNode);
            this.filterNode.connect(this.gainNode);
        };

        CR.prototype.filterDisable = function () {
            if (this.filterActive === false) {
                return;
            }
            this.filterActive = false;
            this.scriptNode.disconnect(this.filterNode);
            this.filterNode.disconnect(this.gainNode);
            this.scriptNode.connect(this.gainNode);
        };

        CR.prototype.init = function (frequency) {
            var self = this;

            this.scriptNode = Audio.createScriptProcessor(8 * 1024, 1, 1);
            this.scriptNode.onaudioprocess = function (audioProcessingEvent) {
                self.onAudioProcess(audioProcessingEvent);
            };

            this.filterNode = Audio.createBiquadFilter();
            this.filterNode.type = 'bandpass';
            this.filterNode.frequency.value = frequency;
            this.filterNode.Q.value = frequency / 100.0;      // TODO change hardcoded bandwidth

            this.gainNode = Audio.createGain();

            this.scriptNode.connect(this.filterNode);
            this.filterNode.connect(this.gainNode);
        };

        CR.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                inputBuffer = audioProcessingEvent.inputBuffer,
                outputBuffer = audioProcessingEvent.outputBuffer,
                inputData,
                outputData;

            inputData = inputBuffer.getChannelData(0);
            outputData = outputBuffer.getChannelData(0);

            for (var sample = 0; sample < inputBuffer.length; sample++) {
                outputData[sample] = inputData[sample]
                this.sampleCount++;
            }
        };

        CR.prototype.destroy = function () {
            /*
            this.scriptNode.disconnect(this.filterNode);
            this.filterNode.disconnect(this.gainNode);
            */
        };

        return CR;
    }

    return _ChannelReceive();        // TODO change it to dependency injection

})();
