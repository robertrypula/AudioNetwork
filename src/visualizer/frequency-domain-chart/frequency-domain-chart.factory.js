// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.FrequencyDomainChart', _FrequencyDomainChart);

    _FrequencyDomainChart.$inject = [
        'Visualizer.AbstractVisualizer',
        'Visualizer.FrequencyDomainChartTemplateMain',
        'Common.Util'
    ];

    function _FrequencyDomainChart(
        AbstractVisualizer,
        FrequencyDomainChartTemplateMain,
        Util
    ) {
        var FrequencyDomainChart;

        FrequencyDomainChart = function (parentElement, width, height, frequencyDomainQueue, powerDecibelMin, radius, barWidth, barSpacingWidth, colorAxis, colorSample) {
            AbstractVisualizer.call(this, parentElement, width, height);

            this.$$frequencyDomainQueue = frequencyDomainQueue;
            this.$$powerDecibelMin = Util.valueOrDefault(powerDecibelMin, -40);
            this.$$radius = Util.valueOrDefault(radius, 1.1);
            this.$$barWidth = Util.valueOrDefault(barWidth, 1);
            this.$$barSpacingWidth = Util.valueOrDefault(barSpacingWidth, 0);
            this.$$colorAxis = Util.valueOrDefault(colorAxis, '#EEE');
            this.$$colorSample = Util.valueOrDefault(colorSample, '#738BD7');

            this.$$checkWidth();

            this.$$hashOnCanvas = null;
        };

        FrequencyDomainChart.prototype = Object.create(AbstractVisualizer.prototype);
        FrequencyDomainChart.prototype.constructor = FrequencyDomainChart;

        FrequencyDomainChart.QUEUE_SIZE_NOT_MATCH_CHART_WIDTH = 'Queue size not match chart width';
        FrequencyDomainChart.$$_POWER_DECIBEL_AXIS_LINE_STEP = 10;

        FrequencyDomainChart.prototype.setWidth = function (width) {
            var element;

            if (this.$$width === width) {
                return false;
            }

            this.$$width = width;
            this.$$checkWidth();

            element = this.$$find('.frequency-domain-chart-container');
            element.style.width = width + 'px';
            element = this.$$find('.frequency-domain-chart');
            element.style.width = width + 'px';
            element.setAttribute("width", width);

            this.$$hashOnCanvas = null;

            return true;
        };

        FrequencyDomainChart.prototype.$$checkWidth = function () {
            if (this.$$frequencyDomainQueue.getSizeMax() * (this.$$barWidth + this.$$barSpacingWidth) !== this.$$width) {
                throw FrequencyDomainChart.QUEUE_SIZE_NOT_MATCH_CHART_WIDTH;
            }
        };

        FrequencyDomainChart.prototype.$$renderTemplate = function () {
            var tpl = FrequencyDomainChartTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$width).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$height).toString());

            return tpl;
        };

        FrequencyDomainChart.prototype.setPowerDecibelMin = function (powerDecibelMin) {
            if (this.$$powerDecibelMin === powerDecibelMin) {
                return false;
            }
            this.$$powerDecibelMin = powerDecibelMin;
            this.$$hashOnCanvas = null;

            return true;
        };

        FrequencyDomainChart.prototype.$$draw = function () {
            var
                ctx = this.$$canvasContext,
                fdq = this.$$frequencyDomainQueue,
                w = this.$$width,
                h = this.$$height,
                frequencyBinPowerDecibel, i, x, y,
                barMiddle
            ;

            if (this.$$hashOnCanvas === fdq.getHash()) {
                return;
            }

            ctx.clearRect(0, 0, w, h);

            ctx.strokeStyle = this.$$colorAxis;
            for (i = 0; i <= -this.$$powerDecibelMin; i += FrequencyDomainChart.$$_POWER_DECIBEL_AXIS_LINE_STEP) {
                y = i *  h / -this.$$powerDecibelMin;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.closePath();
                ctx.stroke();
            }

            ctx.fillStyle = this.$$colorSample;
            barMiddle = 0.5 * (this.$$barWidth - 1);
            for (i = 0; i < fdq.getSize(); i++) {
                frequencyBinPowerDecibel = fdq.getItem(i);

                x = i * (this.$$barWidth + this.$$barSpacingWidth);
                y = ((frequencyBinPowerDecibel / this.$$powerDecibelMin)) * h;

                if (this.$$barSpacingWidth >= 1) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.closePath();
                    ctx.stroke();
                }

                if (y >= h) {
                    continue;
                }

                ctx.beginPath();
                ctx.arc(
                    x + this.$$barSpacingWidth + barMiddle, y,
                    this.$$radius, 0, 2 * Math.PI, false
                );
                ctx.fill();
                // ctx.fillRect(x - 1, y - 1, 3, 3);
            }

            this.$$hashOnCanvas = fdq.getHash();
        };

        FrequencyDomainChart.prototype.$$initCanvasContext = function () {
            this.$$canvasContext.lineWidth = 1;
        };

        return FrequencyDomainChart;
    }

})();
