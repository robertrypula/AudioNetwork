// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.ChannelTransmitManager', _ChannelTransmitManager);

    _ChannelTransmitManager.$inject = [
        'PhysicalLayer.AbstractChannelManager',
        'Common.MathUtil',
        'Audio.ActiveAudioContext',
        'PhysicalLayer.DefaultConfig',
        'PhysicalLayer.ChannelTransmitBuilder'
    ];

    function _ChannelTransmitManager(
        AbstractChannelManager,
        MathUtil,
        Audio,
        DefaultConfig,
        ChannelTransmitBuilder
    ) {
        var ChannelTransmitManager;

        ChannelTransmitManager = function (configuration, bufferSize) {
            AbstractChannelManager.apply(this, arguments);

            this.$$channelTransmit = [];
            this.$$scriptNode = null;
            this.$$configuration = configuration;
            this.$$bufferSize = bufferSize;
            this.$$fakeNoise = false;

            this.$$init();
        };

        ChannelTransmitManager.prototype = Object.create(AbstractChannelManager.prototype);
        ChannelTransmitManager.prototype.constructor = ChannelTransmitManager;

        ChannelTransmitManager.CHANNEL_INDEX_OUT_OF_RANGE_EXCEPTION = 'Channel index out of range: ';

        ChannelTransmitManager.prototype.destroy = function () {
            var i, ct;

            for (i = 0; i < this.$$channelTransmit.length; i++) {
                ct = this.$$channelTransmit[i];
                ct.destroy();
            }
            this.$$channelTransmit.length = 0;
        };

        ChannelTransmitManager.prototype.getOutputNode = function () {
            return this.$$scriptNode;
        };

        ChannelTransmitManager.prototype.getChannelSize = function () {
            return this.$$channelTransmit.length;
        };

        ChannelTransmitManager.prototype.getChannel = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.$$channelTransmit.length) {
                throw ChannelTransmitManager.CHANNEL_INDEX_OUT_OF_RANGE_EXCEPTION + channelIndex;
            }

            return this.$$channelTransmit[channelIndex];
        };

        ChannelTransmitManager.prototype.getBufferSize = function () {
            return this.$$scriptNode.bufferSize;
        };

        ChannelTransmitManager.prototype.$$init = function () {
            var i, ct;

            this.$$scriptNode = Audio.createScriptProcessor(this.$$bufferSize, 1, 1);
            this.$$scriptNode.onaudioprocess = this.onAudioProcess.bind(this);

            for (i = 0; i < this.$$configuration.length; i++) {
                ct = ChannelTransmitBuilder.build(i, this.$$configuration[i]);
                this.$$channelTransmit.push(ct);
            }
        };

        ChannelTransmitManager.prototype.enableFakeNoise = function () {
            this.$$fakeNoise = true;
        };

        ChannelTransmitManager.prototype.disableFakeNoise = function () {
            this.$$fakeNoise = false;
        };

        ChannelTransmitManager.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                outputBuffer = audioProcessingEvent.outputBuffer,
                outputData = outputBuffer.getChannelData(0),
                blockBeginTime = Audio.getCurrentTime(),
                sample, i, j
            ;

            for (i = 0; i < outputBuffer.length; i++) {
                sample = 0;
                for (j = 0; j < this.$$channelTransmit.length; j++) {
                    sample += this.$$channelTransmit[j].getSample();
                }

                if (this.$$fakeNoise) {
                    sample += ((MathUtil.random() * 2) - 1) * DefaultConfig.FAKE_NOISE_MAX_AMPLITUDE;
                }

                outputData[i] = sample;
            }

            this.$$computeCpuLoadData(blockBeginTime, Audio.getCurrentTime(), outputBuffer.length);
        };

        return ChannelTransmitManager;
    }

})();
