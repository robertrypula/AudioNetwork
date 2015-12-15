var ChannelTransmit = (function () {
    'use strict';

    _ChannelTransmit.$inject = [];

    function _ChannelTransmit() {
        var CT;
            
        CT = function (frequency) {
            this.oscillatorNode,
            this.scriptNode,
            this.filterNode; 
            this.sampleCount = 0;
            this.signalQueue = [];

            this.init(frequency);
        };

        CT.prototype.addSignalToQueue = function (signalQueue) {
            var i, sq;

            for (i = 0; i < signalQueue.length; i++) {
                sq = signalQueue[i];
                if (sq.sampleDuration <= 0) {
                    continue;
                }
                this.signalQueue.push({
                    symbol: sq.symbol,
                    sampleDuration: sq.sampleDuration
                });
            }
        };

        CT.prototype.getSymbolFromSignalQueue = function () {
            var symbol = null;

            if (this.signalQueue.length === 0) {
                return symbol;
            }

            symbol = this.signalQueue[0].symbol;
            this.signalQueue[0].sampleDuration--;

            if (this.signalQueue[0].sampleDuration === 0) {
                this.signalQueue.splice(0, 1);
            }

            return symbol;
        };

        CT.prototype.getLastNode = function () {
            return this.filterNode;
        };

        CT.prototype.init = function (frequency) {
            var self = this;

            this.oscillatorNode = Audio.createOscillator();
            this.scriptNode = Audio.createScriptProcessor(8 * 1024, 1, 1);
            this.filterNode = Audio.createBiquadFilter();

            this.scriptNode.onaudioprocess = function (audioProcessingEvent) {
                self.onAudioProcess(audioProcessingEvent);
            };
            this.oscillatorNode.type = 'sine';
            this.oscillatorNode.frequency.value = frequency; // value in hertz

            this.filterNode.type = 'bandpass';
            this.filterNode.frequency.value = frequency;
            this.filterNode.Q.value = frequency / 100.0;      // TODO change hardcoded bandwidth

            this.oscillatorNode.connect(this.scriptNode);
            this.scriptNode.connect(this.filterNode);

            this.oscillatorNode.start();
        };

        CT.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                inputBuffer = audioProcessingEvent.inputBuffer,
                outputBuffer = audioProcessingEvent.outputBuffer,
                inputData,
                outputData,
                symbol;

            // console.log(' currentTime: ', Audio.getCurrentTime(), 'sample count: ', this.sampleCount);
        
            inputData = inputBuffer.getChannelData(0);
            outputData = outputBuffer.getChannelData(0);

            for (var sample = 0; sample < inputBuffer.length; sample++) {
                symbol = this.getSymbolFromSignalQueue();


                if (symbol === null) {
                    outputData[sample] = 0;
                } else {
                    //outputData[sample] = (inputData[sample] * 0.1 + 0.5) * (symbol === 1 ? -1 : 1);
                    outputData[sample] = inputData[sample] * (symbol === 1 ? -1 : 1);
                }
                // outputData[sample] += ((Math.random() * 2) - 1) * 0.2;
                this.sampleCount++;
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
