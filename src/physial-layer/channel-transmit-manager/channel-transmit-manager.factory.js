var ChannelTransmitManager = (function () {
    'use strict';

    _ChannelTransmitManager.$inject = [];

    function _ChannelTransmitManager() {
        var CTM;

        CTM = function (configuration, bufferSize) {
            AbstractChannelManager.apply(this, arguments);

            this.channelTransmit = [];
            this.scriptNode = null;
            this.$$configuration = configuration;
            this.$$bufferSize = bufferSize;

            this.$$init();
        };

        CTM.prototype = Object.create(AbstractChannelManager.prototype);
        CTM.prototype.constructor = CTM;

        CTM.prototype.destroy = function () {
            var i, ct;

            for (i = 0; i < this.channelTransmit.length; i++) {
                ct = this.channelTransmit[i];
                ct.destroy();
            }
            this.channelTransmit.length = 0;
        };

        CTM.prototype.getOutputNode = function () {
            return this.scriptNode;
        };

        CTM.prototype.getChannelSize = function () {
            return this.channelTransmit.length;
        };

        CTM.prototype.getChannel = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.channelTransmit.length) {
                throw 'Channel index out of range: ' + channelIndex;
            }

            return this.channelTransmit[channelIndex];
        };

        CTM.prototype.getBufferSize = function () {
            return this.scriptNode.bufferSize;
        };

        CTM.prototype.$$init = function () {
            var i, ct;

            this.scriptNode = Audio.createScriptProcessor(this.$$bufferSize, 1, 1);
            this.scriptNode.onaudioprocess = this.onAudioProcess.bind(this);

            for (i = 0; i < this.$$configuration.length; i++) {
                ct = ChannelTransmitBuilder.build(i, this.$$configuration[i]);
                this.channelTransmit.push(ct);
            }
        };

        CTM.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                outputBuffer = audioProcessingEvent.outputBuffer,
                outputData = outputBuffer.getChannelData(0),
                blockBeginTime = Audio.getCurrentTime(),
                sample, i, j
            ;

            for (i = 0; i < outputBuffer.length; i++) {
                sample = 0;
                for (j = 0; j < this.channelTransmit.length; j++) {
                    sample += this.channelTransmit[j].getSample();
                }
                outputData[i] = sample;
                // outputData[i] += ((MathUtil.random() * 2) - 1) * 0.001;          // TODO, move to config
            }

            this.$$computeCpuLoadData(blockBeginTime, Audio.getCurrentTime(), outputBuffer.length);
        };

        return CTM;
    }

    return _ChannelTransmitManager();        // TODO change it to dependency injection

})();
