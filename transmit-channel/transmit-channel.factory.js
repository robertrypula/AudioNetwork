var TransmitChannel = (function () {
    'use strict';

    _TransmitChannel.$inject = [];

    function _TransmitChannel() {
        var TC;
            
        TC = function (frequency) {
            this.oscillatorNode,
            this.scriptNode,
            this.filterNode; 

            this.init(frequency);
        };

        TC.prototype.getLastNode = function () {
            return this.filterNode;
        };

        TC.prototype.init = function (frequency) {
            this.oscillatorNode = Audio.createOscillator();
            this.scriptNode = Audio.createScriptProcessor(8 * 1024, 1, 1);
            this.filterNode = Audio.createBiquadFilter();

            this.oscillatorNode.connect(this.scriptNode);
            this.scriptNode.connect(this.filterNode);

            this.scriptNode.onaudioprocess = this.onAudioProcess;
            this.oscillatorNode.type = 'sine';
            this.oscillatorNode.frequency.value = frequency; // value in hertz
            this.oscillatorNode.start();

            console.log(frequency, 'start');
        };

        TC.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                inputBuffer = audioProcessingEvent.inputBuffer,
                outputBuffer = audioProcessingEvent.outputBuffer,
                inputData,
                outputData;

            // console.log('Freqency: ', this.oscillatorNode.frequency.value, ' currentTime: ', Audio.getCurrentTime());

            for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                inputData = inputBuffer.getChannelData(channel);
                outputData = outputBuffer.getChannelData(channel);

                for (var sample = 0; sample < inputBuffer.length; sample++) {
                    outputData[sample] = inputData[sample];
                    outputData[sample] += ((Math.random() * 2) - 1) * 0.2;
                }
            }
        }

        return TC;
    }

    return _TransmitChannel();        // TODO change it to dependency injection

})();
