var ChannelReceiveManager = (function () {
    'use strict';

    _ChannelReceiveManager.$inject = [];

    function _ChannelReceiveManager() {
        var CRM;

        CRM = function (configuration, bufferSize) {
            AbstractChannelManager.apply(this, arguments);

            this.channelReceive = [];
            this.scriptNode = null;
            this.analyserNode = null;  // empty analyser needs to be connected to script node
            this.$$configuration = configuration;
            this.$$bufferSize = bufferSize;
            this.$$sampleNumberGlobal = 0;

            this.$$init();
        };

        CRM.prototype = Object.create(AbstractChannelManager.prototype);
        CRM.prototype.constructor = CRM;

        CRM.prototype.destroy = function () {
            var i, cr;

            for (i = 0; i < this.channelReceive.length; i++) {
                cr = this.channelReceive[i];
                cr.destroy();
            }
            this.channelReceive.length = 0;
        };

        CRM.prototype.getInputNode = function () {
            return this.scriptNode;
        };

        CRM.prototype.getChannelSize = function () {
            return this.channelReceive.length;
        };

        CRM.prototype.getChannel = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.channelReceive.length) {
                throw 'Channel index out of range: ' + channelIndex;
            }

            return this.channelReceive[channelIndex];
        };

        CRM.prototype.getBufferSize = function () {
            return this.scriptNode.bufferSize;
        };

        CRM.prototype.$$init = function () {
            var i, cr;

            this.scriptNode = Audio.createScriptProcessor(this.$$bufferSize, 1, 1);
            this.scriptNode.onaudioprocess = this.onAudioProcess.bind(this);

            this.analyserNode = Audio.createAnalyser();
            this.analyserNode.fftSize = 256;

            this.scriptNode.connect(this.analyserNode);

            for (i = 0; i < this.$$configuration.length; i++) {
                cr = ChannelReceiveBuilder.build(i, this.$$configuration[i]);
                this.channelReceive.push(cr);
            }
        };

        CRM.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                inputBuffer = audioProcessingEvent.inputBuffer,
                inputData = inputBuffer.getChannelData(0),
                blockBeginTime = Audio.getCurrentTime(),
                sample, sampleNumberInBlock, j
            ;

            for (sampleNumberInBlock = 0; sampleNumberInBlock < inputBuffer.length; sampleNumberInBlock++) {
                sample = inputData[sampleNumberInBlock];

                for (j = 0; j < this.channelReceive.length; j++) {
                    this.channelReceive[j].handleSample(
                        sample, 
                        this.$$sampleNumberGlobal,
                        blockBeginTime,
                        sampleNumberInBlock
                    );
                }

                this.$$sampleNumberGlobal++;
            }

            this.$$computeCpuLoadData(blockBeginTime, Audio.getCurrentTime(), inputBuffer.length);
        };



        return CRM;
    }

    return _ChannelReceiveManager();        // TODO change it to dependency injection

})();
