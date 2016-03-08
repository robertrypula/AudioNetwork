var DelayLoopHandler = (function () {
    'use strict';

    _DelayLoopHandler.$inject = [];

    function _DelayLoopHandler() {
        var DLH;

        DLH = function (rxConstellationDiagram, rxHandler) {
            this.$$delay = 1.0;
            this.$$delayedData = [];
            this.$$rxConstellationDiagram = rxConstellationDiagram;
            this.$$rxHandler = rxHandler;

            // console.log(this.$$rxConstellationDiagram);

            this.$$intervalId = setInterval(this.$$intervalHandler.bind(this), 400);
        };

        DLH.prototype.$$intervalHandler = function () {
            var 
                currentTime = Audio.getCurrentTime(),
                item,
                i
            ;
          
            if (this.$$delayedData.length > 0) {
                console.log('-----------------');
            }


            for (i = 0; i < this.$$delayedData.length; i++) {
                item = this.$$delayedData[i];

                DLH.prototype.$$handle(
                    item.channelIndex, 
                    item.carrierDetail, 
                    item.time
                );
            }

            /*
            this.$$delayedData.length = 0;
            */

            // this.$$delayedData.splice(0, 1);
            //  x      x      x      x
            //  . . . . . . . . . . . .

            // console.log(':::::::::  ' + Audio.getCurrentTime());
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
                this.$$rxHandler.callback(channelIndex, carrierDetail, time);
            }
        };

        DLH.prototype.destroy = function () {

        };

        return DLH;
    }

    return _DelayLoopHandler();        // TODO change it to dependency injection

})();
