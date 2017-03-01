// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.ComplexPlaneChart', _ComplexPlaneChart);

    _ComplexPlaneChart.$inject = [
        'Visualizer.Abstract2DVisualizer',
        'Common.Util',
        'Visualizer.ComplexPlaneChartTemplateMain'
    ];

    function _ComplexPlaneChart(
        Abstract2DVisualizer,
        Util,
        ComplexPlaneChartTemplateMain
    ) {
        var ComplexPlaneChart;

        ComplexPlaneChart = function (parentElement, width, height, queue, maxValue, colorAxis, colorPowerLine) {
            Abstract2DVisualizer.call(this, parentElement, width, height, colorAxis, colorPowerLine);

            this.$$queue = queue;
            this.$$maxValue = Util.valueOrDefault(maxValue, 1);

            this.$$hashOnCanvas = null;
        };

        ComplexPlaneChart.prototype = Object.create(Abstract2DVisualizer.prototype);
        ComplexPlaneChart.prototype.constructor = ComplexPlaneChart;

        ComplexPlaneChart.$$_VALUE_CIRCLE_STEP = 1;
        
        ComplexPlaneChart.prototype.setMaxValue = function (maxValue) {
            if (this.$$maxValue === maxValue) {
                return false;
            }
            this.$$maxValue = maxValue;
            this.$$hashOnCanvas = null;
            this.$$dropXYCache();

            return true;
        };

        ComplexPlaneChart.prototype.$$renderTemplate = function () {
            var tpl = ComplexPlaneChartTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$width).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$height).toString());

            return tpl;
        };

        ComplexPlaneChart.prototype.$$draw = function () {
            var
                ctx = this.$$canvasContext,
                w = this.$$width,
                h = this.$$height,
                halfW = 0.5 * w,
                halfH = 0.5 * h,
                q = this.$$queue,
                item,
                valueCircle,
                radius, x, y, i,
                lineWidth
            ;

            if (this.$$hashOnCanvas === q.getHash()) {
                return;
            }

            ctx.clearRect(0, 0, w, h);

            valueCircle = 0;
            while (valueCircle <= this.$$maxValue) {
                radius = halfH * this.$$getNormalizedValue(valueCircle);
                this.$$drawCenteredCircle(radius);
                valueCircle += ComplexPlaneChart.$$_VALUE_CIRCLE_STEP;
            }

            this.$$drawAxis();

            lineWidth = ctx.lineWidth;
            for (i = 0; i < q.getSize(); i++) {
                item = q.getItem(i);
                this.$$setItemXYCache(item);

                x = halfW + halfW * item.$$cache.x;
                y = halfH - halfH * item.$$cache.y;

                if (item.point) {
                    ctx.fillStyle = item.pointColor;
                    ctx.beginPath();
                    ctx.arc(x, y, item.pointRadius, 0, 2 * Math.PI, false);
                    ctx.fill();
                }

                if (item.line) {
                    ctx.lineWidth = item.lineWidth;
                    ctx.strokeStyle = item.lineColor;
                    ctx.beginPath();
                    ctx.moveTo(halfW, halfH);
                    ctx.lineTo(x, y);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
            ctx.lineWidth = lineWidth;

            this.$$hashOnCanvas = q.getHash();
        };

        ComplexPlaneChart.prototype.$$setItemXYCache = function (item) {
            if (item.$$cache) {
                return;
            }

            item.$$cache = {
                x: this.$$getNormalizedValue(item.real),
                y: this.$$getNormalizedValue(item.imm)
            };
        };

        ComplexPlaneChart.prototype.$$getNormalizedValue = function (value) {
            return value / this.$$maxValue;
        };

        return ComplexPlaneChart;
    }

})();
