var ChannelTransmit = (function () {
    'use strict';

    _ChannelTransmit.$inject = [];

    function _ChannelTransmit() {
        var CT;
            
        CT = function (frequency) {
            this.oscillatorNode,
            this.scriptNode,
            this.filterNode; 

            this.init(frequency);
        };

        CT.prototype.getLastNode = function () {
            return this.scriptNode;
        };

        CT.prototype.init = function (frequency) {
            this.oscillatorNode = Audio.createOscillator();
            this.scriptNode = Audio.createScriptProcessor(8 * 1024, 1, 1);
            this.filterNode = Audio.createBiquadFilter();

            this.scriptNode.onaudioprocess = this.onAudioProcess;
            this.oscillatorNode.type = 'sine';
            this.oscillatorNode.frequency.value = frequency; // value in hertz

            this.oscillatorNode.connect(this.scriptNode);
            this.scriptNode.connect(this.filterNode);

            this.oscillatorNode.start();
        };

        CT.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                inputBuffer = audioProcessingEvent.inputBuffer,
                outputBuffer = audioProcessingEvent.outputBuffer,
                inputData,
                outputData;

            // console.log('Freqency: ', this.oscillatorNode.frequency.value, ' currentTime: ', Audio.getCurrentTime());
        
            inputData = inputBuffer.getChannelData(0);
            outputData = outputBuffer.getChannelData(0);

            for (var sample = 0; sample < inputBuffer.length; sample++) {
                outputData[sample] = inputData[sample];
                outputData[sample] += ((Math.random() * 2) - 1) * 0.2;
            }
        };

        CT.prototype.destroy = function () {
            this.oscillatorNode.stop();
            this.oscillatorNode.disconnect(this.scriptNode);
            this.scriptNode.disconnect(this.filterNode);
        };

        return CT;
    }

    return _ChannelTransmit();        // TODO change it to dependency injection

})();
