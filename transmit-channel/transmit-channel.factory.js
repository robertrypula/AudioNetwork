var TransmitChannel = (function () {
    'use strict';

    _TransmitChannel.$inject = [];

    function _TransmitChannel() {
        var
            TC,
            oscillatorNode,
            scriptNode,
            filterNode;

        TC = function (frequency) {
            init(frequency);
        };

        TC.prototype.getLastNode = function () {
            return filterNode;
        }

        function init(frequency) {
            oscillatorNode = Audio.createOscillator();
            scriptNode = Audio.createScriptProcessor(4096, 1, 1);
            filterNode = Audio.createBiquadFilter();

            oscillatorNode.connect(scriptNode);
            scriptNode.connect(filterNode);

            scriptNode.onaudioprocess = onAudioProcess;
            oscillatorNode.type = 'sine';
            oscillatorNode.frequency.value = frequency; // value in hertz
            oscillatorNode.start();

            console.log(frequency, 'start');
        }

        function onAudioProcess(audioProcessingEvent) {
            var
                inputBuffer = audioProcessingEvent.inputBuffer,
                outputBuffer = audioProcessingEvent.outputBuffer,
                inputData,
                outputData;

            console.log('Freqency: ', oscillatorNode.frequency.value, ' currentTime: ', Audio.getCurrentTime());

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
