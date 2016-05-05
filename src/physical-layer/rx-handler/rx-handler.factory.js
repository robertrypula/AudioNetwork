var RxHandler = (function () {
    'use strict';

    _RxHandler.$inject = [];

    function _RxHandler() {
        var
            RH,
            CONSTELLATION_DIAGRAM_DECIBEL_LIMIT = 40                         // TODO, move to some common place
        ;

        RH = function (rxConstellationDiagram, rxExternalHandler) {
            this.$$delayedData = [];
            this.$$rxConstellationDiagram = rxConstellationDiagram;
            this.$$rxExternalHandler = rxExternalHandler;
            this.$$intervalId = setInterval(this.$$intervalHandler.bind(this), RH.$$_DELAY_LOOP_RESOLUTION);
        };

        RH.$$_RX_EXTRA_DELAY = 0.05;        // [sec]
        RH.$$_DELAY_LOOP_RESOLUTION = 8;    // [ms]

        RH.prototype.$$intervalHandler = function () {
            var
                currentTime = Audio.getCurrentTime(),
                removedCount = 0,
                item, i
            ;

            for (i = 0; i < this.$$delayedData.length; i++) {
                item = this.$$delayedData[i];

                if (item.time < (currentTime - RH.$$_RX_EXTRA_DELAY)) {
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

        RH.prototype.handle = function (channelIndex, carrierDetail, time) {
            this.$$delayedData.push({
                channelIndex: channelIndex,
                carrierDetail: carrierDetail,
                time: time
            });
        };

        RH.prototype.$$handle = function (channelIndex, carrierDetail, time) {
            var i, cd, queue, powerNormalized;

            for (i = 0; i < carrierDetail.length; i++) {
                cd = carrierDetail[i];
                if (cd.powerDecibel === -Infinity) {
                    cd.powerDecibel = -99;
                }
                cd.powerDecibel = cd.powerDecibel < -99 ? -99 : cd.powerDecibel;

                if (this.$$rxConstellationDiagram.length === 0) {
                    continue;
                }

                queue = this.$$rxConstellationDiagram[channelIndex].queue[i];
                powerNormalized = (cd.powerDecibel + CONSTELLATION_DIAGRAM_DECIBEL_LIMIT) / CONSTELLATION_DIAGRAM_DECIBEL_LIMIT;
                powerNormalized = powerNormalized < 0 ? 0 : powerNormalized;
                if (queue.isFull()) {
                    queue.pop();
                    queue.pop();
                }
                queue.push(powerNormalized * MathUtil.cos(MathUtil.TWO_PI * cd.phase));
                queue.push(powerNormalized * MathUtil.sin(MathUtil.TWO_PI * cd.phase));
            }

            if (this.$$rxExternalHandler.callback) {
                this.$$rxExternalHandler.callback(channelIndex, carrierDetail, Audio.getCurrentTime());
            }
        };

        RH.prototype.destroy = function () {
            clearInterval(this.$$intervalId);
        };

        return RH;
    }

    return _RxHandler();        // TODO change it to dependency injection

})();
