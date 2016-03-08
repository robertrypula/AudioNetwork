var DelayLoopHandler = (function () {
    'use strict';

    _DelayLoopHandler.$inject = [];

    function _DelayLoopHandler() {
        var DLH;

        DLH = function (rxConstellationDiagram, rxHandler) {
            this.$$rxConstellationDiagram = rxConstellationDiagram;
            this.$$rxHandler = rxHandler;
        };

        DLH.prototype.handle = function (channelIndex, carrierDetail, time) {
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
                this.$$rxHandler.callback(channelIndex, carrierDetail, time);
            }
        };

        DLH.prototype.destroy = function () {

        };

        return DLH;
    }

    return _DelayLoopHandler();        // TODO change it to dependency injection

})();
