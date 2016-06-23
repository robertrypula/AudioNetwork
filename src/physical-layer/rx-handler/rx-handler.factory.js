// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.RxHandler', _RxHandler);

    _RxHandler.$inject = [
        'PhysicalLayer.DefaultConfig',
        'PhysicalLayer.Audio',
        'Common.MathUtil'
    ];

    function _RxHandler(
        DefaultConfig,
        Audio,
        MathUtil
    ) {
        var RxHandler;

        RxHandler = function (rxConstellationDiagram, rxExternalHandler) {
            this.$$delayedData = [];
            this.$$rxConstellationDiagram = rxConstellationDiagram;
            this.$$rxExternalHandler = rxExternalHandler;
            this.$$intervalId = setInterval(this.$$intervalHandler.bind(this), RxHandler.$$_DELAY_LOOP_RESOLUTION);
        };

        RxHandler.$$_RX_EXTRA_DELAY = 0.05;        // [sec]
        RxHandler.$$_DELAY_LOOP_RESOLUTION = 8;    // [ms]

        RxHandler.prototype.$$intervalHandler = function () {
            var
                currentTime = Audio.getCurrentTime(),
                removedCount = 0,
                item, i
            ;

            for (i = 0; i < this.$$delayedData.length; i++) {
                item = this.$$delayedData[i];

                if (item.time < (currentTime - RxHandler.$$_RX_EXTRA_DELAY)) {
                    this.$$handle(
                        item.channelIndex,
                        item.carrierDetail,
                        item.time
                    );
                    removedCount++;
                } else {
                    break;
                }
            }

            /*
            // TODO enable if needed
            if (console && removedCount > 1) {
                console.log('Delay loop warning - processed more than one rx item: ' + removedCount);
            }
            */

            if (removedCount > 0) {
                this.$$delayedData.splice(0, removedCount);
            }
        };

        RxHandler.prototype.handle = function (channelIndex, carrierDetail, time) {
            this.$$delayedData.push({
                channelIndex: channelIndex,
                carrierDetail: carrierDetail,
                time: time
            });
        };

        RxHandler.prototype.$$handle = function (channelIndex, carrierDetail, time) {
            var i, cd, queue, powerNormalized;

            for (i = 0; i < carrierDetail.length; i++) {
                cd = carrierDetail[i];
                if (cd.powerDecibel === -Infinity) {
                    cd.powerDecibel = DefaultConfig.MINIMUM_POWER_DECIBEL;
                }
                cd.powerDecibel = cd.powerDecibel < DefaultConfig.MINIMUM_POWER_DECIBEL ? DefaultConfig.MINIMUM_POWER_DECIBEL : cd.powerDecibel;

                if (this.$$rxConstellationDiagram.length === 0) {
                    continue;
                }

                queue = this.$$rxConstellationDiagram[channelIndex].queue[i];
                powerNormalized = (cd.powerDecibel + DefaultConfig.CONSTELLATION_DIAGRAM_DECIBEL_LIMIT) / DefaultConfig.CONSTELLATION_DIAGRAM_DECIBEL_LIMIT;
                powerNormalized = powerNormalized < 0 ? 0 : powerNormalized;
                queue.pushEvenIfFull(powerNormalized * MathUtil.cos(MathUtil.TWO_PI * cd.phase));
                queue.pushEvenIfFull(powerNormalized * MathUtil.sin(MathUtil.TWO_PI * cd.phase));
            }

            if (this.$$rxExternalHandler.callback) {
                this.$$rxExternalHandler.callback(channelIndex, carrierDetail, Audio.getCurrentTime());
            }
        };

        RxHandler.prototype.destroy = function () {
            clearInterval(this.$$intervalId);
        };

        return RxHandler;
    }

})();
