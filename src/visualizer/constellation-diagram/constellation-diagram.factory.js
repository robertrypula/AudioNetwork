// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.ConstellationDiagram', _ConstellationDiagram);

    _ConstellationDiagram.$inject = [
        'Visualizer.Abstract2DVisualizer',
        'Common.MathUtil',
        'Common.Util',
        'Visualizer.ConstellationDiagramTemplateMain'
    ];

    function _ConstellationDiagram(
        Abstract2DVisualizer,
        MathUtil,
        Util,
        ConstellationDiagramTemplateMain
    ) {
        var ConstellationDiagram;

        ConstellationDiagram = function (parentElement, width, height, queue, powerDecibelMin, colorAxis, colorHistoryPoint, colorPowerLine, radius, radiusMain) {
            Abstract2DVisualizer.call(this, parentElement, width, height, colorAxis, colorPowerLine);

            this.$$queue = queue;
            this.$$colorHistoryPoint = Util.valueOrDefault(
                colorHistoryPoint,
                {
                    red: {
                        newest: 0,
                        tailNewest: 100,
                        tailOldest: 180
                    },
                    green: {
                        newest: 0,
                        tailNewest: 100,
                        tailOldest: 200
                    },
                    blue: {
                        newest: 0,
                        tailNewest: 100,
                        tailOldest: 150
                    }
                }
            );
            this.$$radius = Util.valueOrDefault(radius, 2);
            this.$$radiusMain = Util.valueOrDefault(radiusMain, 3);
            this.$$powerDecibelMin = Util.valueOrDefault(powerDecibelMin, -40);

            this.$$hashOnCanvas = null;
        };

        ConstellationDiagram.prototype = Object.create(Abstract2DVisualizer.prototype);
        ConstellationDiagram.prototype.constructor = ConstellationDiagram;

        ConstellationDiagram.$$_POWER_DECIBEL_AXIS_LINE_STEP = 10;
        
        ConstellationDiagram.prototype.setPowerDecibelMin = function (powerDecibelMin) {
            if (this.$$powerDecibelMin === powerDecibelMin) {
                return false;
            }
            this.$$powerDecibelMin = powerDecibelMin;
            this.$$hashOnCanvas = null;
            this.$$dropXYCache();

            return true;
        };

        ConstellationDiagram.prototype.$$renderTemplate = function () {
            var tpl = ConstellationDiagramTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$width).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$height).toString());

            return tpl;
        };

        ConstellationDiagram.prototype.$$draw = function () {
            var
                chp = this.$$colorHistoryPoint,
                ctx = this.$$canvasContext,
                w = this.$$width,
                h = this.$$height,
                halfW = 0.5 * w,
                halfH = 0.5 * h,
                q = this.$$queue,
                item,
                powerDecibel,
                tailUnitPosition, color, radius, x, y, i, isNewest
            ;

            if (this.$$hashOnCanvas === q.getHash()) {
                return;
            }

            ctx.clearRect(0, 0, w, h);

            powerDecibel = 0;
            while (powerDecibel >= this.$$powerDecibelMin) {
                radius = halfH * this.$$getNormalizedPowerDecibel(powerDecibel);
                this.$$drawCenteredCircle(radius);
                powerDecibel -= ConstellationDiagram.$$_POWER_DECIBEL_AXIS_LINE_STEP;
            }

            this.$$drawAxis();

            // from oldest to newest
            for (i = 0; i < q.getSize(); i++) {
                item = q.getItem(i);
                this.$$setItemXYCache(item);

                //if (item.$$cache.outOfRange) {
                //    continue;
                //}

                x = halfW + halfW * item.$$cache.x;
                y = halfH - halfH * item.$$cache.y;
                tailUnitPosition = 1 - (i / (q.getSize() - 2));
                isNewest = (i === q.getSize() - 1);

                if (isNewest) {
                    color = (
                        'rgba(' + chp.red.newest + ', ' + chp.green.newest + ', ' + chp.blue.newest + ', ' + '1)'
                    );
                } else {
                    color = (
                        'rgba(' +
                        this.$$colorInterpolate(chp.red.tailNewest, chp.red.tailOldest, tailUnitPosition) + ', ' +
                        this.$$colorInterpolate(chp.green.tailNewest, chp.green.tailOldest, tailUnitPosition) + ', ' +
                        this.$$colorInterpolate(chp.blue.tailNewest, chp.blue.tailOldest, tailUnitPosition) + ', ' +
                        '1)'
                    );
                }

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(
                    x, y,
                    isNewest ? this.$$radiusMain : this.$$radius,
                    0, 2 * Math.PI, false
                );
                ctx.fill();
                /*
                ctx.fillRect(
                    x - (isNewest ? 2 : 1),
                    y - (isNewest ? 2 : 1),
                    (isNewest ? 5 : 3),
                    (isNewest ? 5 : 3)
                );
                */
            }

            this.$$hashOnCanvas = q.getHash();
        };

        ConstellationDiagram.prototype.$$getNormalizedPowerDecibel = function (powerDecibel) {
            var normalizedPowerDecibel;

            normalizedPowerDecibel = powerDecibel / this.$$powerDecibelMin;
            normalizedPowerDecibel = 1 - normalizedPowerDecibel;
            normalizedPowerDecibel = normalizedPowerDecibel < 0 ? null : normalizedPowerDecibel;

            return normalizedPowerDecibel;
        };

        ConstellationDiagram.prototype.$$setItemXYCache = function (item) {
            var normalizedPowerDecibel;

            if (item.$$cache) {
                return;
            }

            normalizedPowerDecibel = this.$$getNormalizedPowerDecibel(item.powerDecibel);
            item.$$cache = {
                x: normalizedPowerDecibel === null
                    ? 0
                    : (normalizedPowerDecibel * MathUtil.sin(MathUtil.TWO_PI * item.phase)),
                y: normalizedPowerDecibel === null
                    ? 0
                    : (normalizedPowerDecibel * MathUtil.cos(MathUtil.TWO_PI * item.phase)),
                outOfRange: normalizedPowerDecibel === null ? true : false
            };
        };

        ConstellationDiagram.prototype.$$colorInterpolate = function (start, end, unitPosition) {
            return MathUtil.round(start + ((end - start) * unitPosition));
        };

        return ConstellationDiagram;
    }

})();
