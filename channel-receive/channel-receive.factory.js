var ChannelReceive = (function () {
    'use strict';

    _ChannelReceive.$inject = [];

    function _ChannelReceive() {
        var CR;
            
        CR = function (frequency) {
            this.gainNode = null;
            this.filterNode = null;
            this.scriptStageMulNode = null;
            this.scriptStageIntNode = null;
            this.scriptStageThrNode = null;

            this.analyserStageRawNode = null;
            this.analyserStageMulNode = null;
            this.analyserStageIntNode = null;
            this.analyserStageThrNode = null;


            
            //                   analyser         analyser               analyser                    analyser
            //                       |                |                      |                           |
            // GAIN --+-> (filter) --+---> script ----+-------> script ------+---------> script ---------+
            //            raw data         mul by carrier       integral with            threshold with
            //                             or zero              (sin period span)        'delayed' state trans

            
            this.sampleCountMul = 0;
            this.sampleCountInt = 0;
            this.sampleCountThr = 0;
            this.frequency = 0;
            this.samplesPerPeriod = 0;
            // this.filterActive = true;

            this.init(frequency);
        };

        CR.prototype.init = function (frequency) {
            var self = this;

            this.frequency = frequency;
            this.samplesPerPeriod = Audio.sampleRate / this.frequency;

            this.gainNode = Audio.createGain();

            this.filterNode = Audio.createBiquadFilter();
            this.filterNode.type = 'bandpass';
            this.filterNode.frequency.value = frequency;
            this.filterNode.Q.value = frequency / 100.0;      // TODO change hardcoded bandwidth

            this.scriptStageMulNode = Audio.createScriptProcessor(8 * 1024, 1, 1);
            this.scriptStageMulNode.onaudioprocess = function (audioProcessingEvent) {
                self.onAudioProcessStageMul(audioProcessingEvent);
            };
            this.carrierRecovery = CarrierRecoveryBuilder.build(this.samplesPerPeriod);

            this.scriptStageIntNode = Audio.createScriptProcessor(8 * 1024, 1, 1);
            this.scriptStageIntNode.onaudioprocess = function (audioProcessingEvent) {
                self.onAudioProcessStageInt(audioProcessingEvent);
            };

            this.scriptStageThrNode = Audio.createScriptProcessor(8 * 1024, 1, 1);
            this.scriptStageThrNode.onaudioprocess = function (audioProcessingEvent) {
                self.onAudioProcessStageThr(audioProcessingEvent);
            };

            this.gainNode.connect(this.filterNode);
            this.filterNode.connect(this.scriptStageMulNode);
            this.scriptStageMulNode.connect(this.scriptStageIntNode);
            this.scriptStageIntNode.connect(this.scriptStageThrNode);

            // attach analysers
            this.analyserStageThrNode = Audio.createAnalyser();
            this.analyserStageThrNode.fftSize = 4 * 1024;
            this.scriptStageThrNode.connect(this.analyserStageThrNode);

        };

        /*
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
        */

        CR.prototype.getFirstNode = function () {
            return this.gainNode;
        };

        CR.prototype.onAudioProcessStageMul = function (audioProcessingEvent) {
            var
                inp = audioProcessingEvent.inputBuffer.getChannelData(0),
                out = audioProcessingEvent.outputBuffer.getChannelData(0),
                inputSample,
                outputSample;

            for (var sampleIndex = 0; sampleIndex < audioProcessingEvent.inputBuffer.length; sampleIndex++) {
                inputSample = inp[sampleIndex];
                outputSample = 0;

                this.carrierRecovery.handleSample(inputSample);
                if (this.carrierRecovery.carrierAvailable()) {
                    outputSample = inputSample * this.carrierRecovery.getCarrier();
                }

                out[sampleIndex] = outputSample;
                this.sampleCountMul++;
            }
        };

        CR.prototype.onAudioProcessStageInt = function (audioProcessingEvent) {
            var
                sum,
                sumItemSize,
                sampleStart,
                sampleStop,
                inp = audioProcessingEvent.inputBuffer.getChannelData(0),
                out = audioProcessingEvent.outputBuffer.getChannelData(0);

            for (var sample = 0; sample < audioProcessingEvent.inputBuffer.length; sample++) {
                /*
                sampleStart = Math.round(sample - 0.5 * this.samplesPerPeriod);
                sampleStart = sampleStart < 0 ? 0 : sampleStart;
                sampleStop = Math.round(sample - 0.5 * this.samplesPerPeriod);
                sampleStop = sampleStop >= audioProcessingEvent.inputBuffer.length ? audioProcessingEvent.inputBuffer.length - 1 : sampleStop;
                sum = 0;
                sumItemSize = 0;
                for (var i = sample + 1; i <= sampleStop; i++) {
                    sum = 0;
                    sum += inp[i];
                    sumItemSize++;
                }

                out[sample] = sum / sumItemSize;
                */
                out[sample] = inp[sample];

                this.sampleCountInt++;
            }
        };

        CR.prototype.onAudioProcessStageThr = function (audioProcessingEvent) {
            var
                inp = audioProcessingEvent.inputBuffer.getChannelData(0),
                out = audioProcessingEvent.outputBuffer.getChannelData(0);

            for (var sample = 0; sample < audioProcessingEvent.inputBuffer.length; sample++) {
                out[sample] = inp[sample];
                // out[sample] = inp[sample] > 0.5 ? 1 : inp[sample];
                this.sampleCountThr++;
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
