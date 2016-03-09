var DelayLoopHandler = (function () {
    'use strict';

    _DelayLoopHandler.$inject = [];

    function _DelayLoopHandler() {
        var
            DLH,
            RX_EXTRA_DELAY = 0.05, // [sec]
            DELAY_LOOP_RESOLUTION = 4 // [ms]
        ;

        DLH = function (rxConstellationDiagram, rxHandler) {
            this.$$delayedData = [];
            this.$$rxConstellationDiagram = rxConstellationDiagram;
            this.$$rxHandler = rxHandler;
            this.$$intervalId = setInterval(this.$$intervalHandler.bind(this), DELAY_LOOP_RESOLUTION);
        };

        DLH.prototype.$$intervalHandler = function () {
            var
                currentTime = Audio.getCurrentTime(),
                removedCount = 0,
                item, i
            ;

            for (i = 0; i < this.$$delayedData.length; i++) {
                item = this.$$delayedData[i];

                if (item.time < (currentTime - RX_EXTRA_DELAY)) {
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

        DLH.prototype.handle = function (channelIndex, carrierDetail, time) {
            this.$$delayedData.push({
                channelIndex: channelIndex,
                carrierDetail: carrierDetail,
                time: time
            });
        };

        DLH.prototype.$$handle = function (channelIndex, carrierDetail, time) {
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
                powerNormalized = (cd.powerDecibel + 40) / 40;
                powerNormalized = powerNormalized < 0 ? 0 : powerNormalized;
                if (queue.isFull()) {
                    queue.pop();
                    queue.pop();
                }
                queue.push(powerNormalized * MathUtil.cos(MathUtil.TWO_PI * cd.phase));
                queue.push(powerNormalized * MathUtil.sin(MathUtil.TWO_PI * cd.phase));
            }

            if (this.$$rxHandler.callback) {
                this.$$rxHandler.callback(channelIndex, carrierDetail, Audio.getCurrentTime());
            }
        };

        DLH.prototype.destroy = function () {
            clearInterval(this.$$intervalId);
        };

        return DLH;
    }

    return _DelayLoopHandler();        // TODO change it to dependency injection

})();
