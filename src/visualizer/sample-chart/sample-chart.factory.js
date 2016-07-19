// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.SampleChart', _SampleChart);

    _SampleChart.$inject = [
        'Visualizer.AbstractVisualizer',
        'Visualizer.SampleChartTemplateMain',
        'Common.Util'
    ];

    function _SampleChart(
        AbstractVisualizer,
        SampleChartTemplateMain,
        Util
    ) {
        var SampleChart;

        SampleChart = function (parentElement, width, height, queue, radius, barWidth, barSpacingWidth, colorAxis, colorSample) {
            AbstractVisualizer.call(this, parentElement, width, height);

            this.$$queue = queue;
            this.$$radius = Util.valueOrDefault(radius, 1.1);
            this.$$barWidth = Util.valueOrDefault(barWidth, 1);
            this.$$barSpacingWidth = Util.valueOrDefault(barSpacingWidth, 0);
            this.$$colorAxis = Util.valueOrDefault(colorAxis, '#EEE');
            this.$$colorSample = Util.valueOrDefault(colorSample, '#738BD7');

            this.$$checkWidth();

            this.$$hashOnCanvas = null;
        };

        SampleChart.prototype = Object.create(AbstractVisualizer.prototype);
        SampleChart.prototype.constructor = SampleChart;

        SampleChart.QUEUE_SIZE_NOT_MATCH_CHART_WIDTH = 'Queue size not match chart width';

        SampleChart.prototype.setWidth = function (width) {
            var element;

            if (this.$$width === width) {
                return false;
            }

            this.$$width = width;
            this.$$checkWidth();

            element = this.$$find('.sample-chart-container');
            element.style.width = width + 'px';
            element = this.$$find('.sample-chart');
            element.style.width = width + 'px';
            element.setAttribute("width", width);

            this.$$hashOnCanvas = null;

            return true;
        };

        SampleChart.prototype.$$checkWidth = function () {
            if (this.$$queue.getSizeMax() * (this.$$barWidth + this.$$barSpacingWidth) !== this.$$width) {
                throw SampleChart.QUEUE_SIZE_NOT_MATCH_CHART_WIDTH;
            }
        };

        SampleChart.prototype.$$renderTemplate = function () {
            var tpl = SampleChartTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$width).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$height).toString());

            return tpl;
        };

        SampleChart.prototype.$$draw = function () {
            var
                ctx = this.$$canvasContext,
                q = this.$$queue,
                w = this.$$width,
                h = this.$$height,
                sample, i, x, y, barMiddle
            ;

            if (this.$$hashOnCanvas === q.getHash()) {
                return;
            }

            ctx.clearRect(0, 0, w, h);
            
            ctx.strokeStyle = this.$$colorAxis;
            ctx.beginPath();
            ctx.moveTo(0, 0.5 * h);
            ctx.lineTo(w, 0.5 * h);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = this.$$colorSample;
            barMiddle = 0.5 * (this.$$barWidth - 1);
            for (i = 0; i < q.getSize(); i++) {
                sample = q.getItem(i);

                x = i * (this.$$barWidth + this.$$barSpacingWidth);
                y = (0.5 - 0.5 * sample) * h;

                if (this.$$barSpacingWidth >= 1) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.closePath();
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(
                    x + this.$$barSpacingWidth + barMiddle, y,
                    this.$$radius, 0, 2 * Math.PI, false
                );
                ctx.fill();
                // ctx.fillRect(x - 1, y - 1, 3, 3);
            }

            this.$$hashOnCanvas = q.getHash();
        };

        SampleChart.prototype.$$initCanvasContext = function () {
            this.$$canvasContext.lineWidth = 1;
        };

        return SampleChart;
    }

})();