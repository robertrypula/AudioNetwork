var ChannelTransmit = (function () {
    'use strict';

    _ChannelTransmit.$inject = [];

    function _ChannelTransmit() {
        var CT;
            
        CT = function (frequency) {
            this.oscillatorNode = null;
            this.scriptNode = null;
            this.filterNode = null;
            this.gainNode = null;
            this.sampleCount = 0;
            this.signalQueue = [];
            this.filterActive = true;

            this.init(frequency);
        };

        CT.prototype.filterToggle = function () {
            if (this.filterActive) {
                this.filterDisable();
            } else {
                this.filterEnable();
            }
        };

        CT.prototype.filterEnable = function () {
            if (this.filterActive === true) {
                return;
            }
            this.filterActive = true;
            this.scriptNode.disconnect(this.gainNode);
            this.scriptNode.connect(this.filterNode);
            this.filterNode.connect(this.gainNode);
        };

        CT.prototype.filterDisable = function () {
            if (this.filterActive === false) {
                return;
            }
            this.filterActive = false;
            this.scriptNode.disconnect(this.filterNode);
            this.filterNode.disconnect(this.gainNode);
            this.scriptNode.connect(this.gainNode);
        };

        CT.prototype.addSignalToQueue = function (signalQueue) {
            var i, sq;

            for (i = 0; i < signalQueue.length; i++) {
                sq = signalQueue[i];
                if (sq.duration <= 0) {
                    continue;
                }
                this.signalQueue.push({
                    symbol: sq.symbol,
                    duration: sq.duration
                });
            }
        };

        CT.prototype.getSymbolFromSignalQueue = function () {
            var symbol = null;

            if (this.signalQueue.length === 0) {
                return symbol;
            }

            symbol = this.signalQueue[0].symbol;
            this.signalQueue[0].duration--;

            if (this.signalQueue[0].duration === 0) {
                this.signalQueue.splice(0, 1);
            }

            return symbol;
        };

        CT.prototype.getLastNode = function () {
            return this.gainNode;
        };

        CT.prototype.init = function (frequency) {
            var self = this;

            this.oscillatorNode = Audio.createOscillator();
            this.oscillatorNode.type = 'sine';
            this.oscillatorNode.frequency.value = frequency; // value in hertz

            this.scriptNode = Audio.createScriptProcessor(8 * 1024, 1, 1);
            this.scriptNode.onaudioprocess = function (audioProcessingEvent) {
                self.onAudioProcess(audioProcessingEvent);
            };

            this.filterNode = Audio.createBiquadFilter();
            this.filterNode.type = 'bandpass';
            this.filterNode.frequency.value = frequency;
            this.filterNode.Q.value = frequency / 100.0;      // TODO change hardcoded bandwidth

            this.gainNode = Audio.createGain();

            this.oscillatorNode.connect(this.scriptNode);
            this.scriptNode.connect(this.filterNode);
            this.filterNode.connect(this.gainNode);
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
                    outputData[sample] = inputData[sample] * (symbol === 1 ? -1 : 1);
                }
                outputData[sample] += ((Math.random() * 2) - 1) * 0.2;
                this.sampleCount++;
            }
        };

        CT.prototype.destroy = function () {
            this.oscillatorNode.stop();
            this.oscillatorNode.disconnect(this.scriptNode);
            this.scriptNode.disconnect(this.filterNode);
            this.filterNode.disconnect(this.gainNode);
        };

        return CT;
    }

    return _ChannelTransmit();        // TODO change it to dependency injection

})();
