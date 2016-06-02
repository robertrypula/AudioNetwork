// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.AbstractChannelManager', _AbstractChannelManager);

    _AbstractChannelManager.$inject = [
        'PhysicalLayer.Audio'
    ];

    function _AbstractChannelManager(
        Audio
    ) {
        var AbstractChannelManager;

        AbstractChannelManager = function () {
            this.$$cpuLoadData = {
                blockSampleSize: null,
                blockTime: null,
                blockRealTime: null,
                load: null
            };
        };

        AbstractChannelManager.prototype.getCpuLoadData = function () {
            var c = this.$$cpuLoadData;

            return {
                blockSampleSize: c.blockSampleSize,
                blockTime: c.blockTime,
                blockRealTime: c.blockRealTime,
                load: c.load
            };
        };

        AbstractChannelManager.prototype.$$computeCpuLoadData = function (beginTime, endTime, blockSampleSize) {
            var 
                c = this.$$cpuLoadData,
                blockRealTime, 
                blockTime;

            blockRealTime = endTime - beginTime;
            blockTime = blockSampleSize / Audio.getSampleRate();
            
            c.blockSampleSize = blockSampleSize;
            c.blockTime = blockTime;
            c.blockRealTime = blockRealTime;
            c.load = blockRealTime / blockTime;
        };

        return AbstractChannelManager;
    }

})();
