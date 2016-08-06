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

        SampleChart = function (parentElement, width, height, queue, radius, barWidth, barSpacingWidth, colorAxis, colorSample, colorBar) {
            AbstractVisualizer.call(this, parentElement, width, height);

            this.$$queue = queue;
            this.$$radius = Util.valueOrDefault(radius, 1.1);
            this.$$barWidth = Util.valueOrDefault(barWidth, 1);
            this.$$barSpacingWidth = Util.valueOrDefault(barSpacingWidth, 0);
            this.$$colorAxis = Util.valueOrDefault(colorAxis, '#EEE');
            this.$$colorSample = Util.valueOrDefault(colorSample, 'rgba(115, 139, 215, 1.0');
            this.$$colorBar = Util.valueOrDefault(colorBar, 'rgba(115, 139, 215, 0.9)');

            this.$$sampleBackgroundActive = false;

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

        SampleChart.prototype.enableSampleBackground = function () {
            if (this.$$sampleBackgroundActive) {
                return false;
            }

            this.$$sampleBackgroundActive = true;
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
                hHalf = this.$$height * 0.5,
                sample, i, x, y, barMiddle
            ;

            if (this.$$hashOnCanvas === q.getHash()) {
                return;
            }

            ctx.clearRect(0, 0, w, h);

            // draw horizontal axis
            ctx.strokeStyle = this.$$colorAxis;
            ctx.beginPath();
            ctx.moveTo(0, hHalf);
            ctx.lineTo(w, hHalf);
            ctx.closePath();
            ctx.stroke();

            barMiddle = 0.5 * (this.$$barWidth - 1);
            for (i = 0; i < q.getSize(); i++) {
                sample = q.getItem(i);

                x = i * (this.$$barWidth + this.$$barSpacingWidth);
                y = (0.5 - 0.5 * sample) * h;

                if (this.$$barSpacingWidth > 0) {
                    // draw bar spacing
                    if (this.$$barSpacingWidth === 1) {
                        ctx.strokeStyle = this.$$colorAxis;
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, h);
                        ctx.closePath();
                        ctx.stroke();
                    } else {
                        ctx.fillStyle = this.$$colorAxis;
                        ctx.fillRect(
                            x, 0,
                            this.$$barSpacingWidth, h
                        );
                    }
                }

                if (this.$$sampleBackgroundActive) {
                    // draw sample-origin background
                    if (this.$$barWidth === 1) {
                        ctx.strokeStyle = this.$$colorBar;
                        ctx.beginPath();
                        ctx.moveTo(x + this.$$barSpacingWidth, hHalf);
                        ctx.lineTo(x + this.$$barSpacingWidth, y);
                        ctx.closePath();
                        ctx.stroke();
                    } else {
                        ctx.fillStyle = this.$$colorBar;
                        ctx.fillRect(
                            x + this.$$barSpacingWidth,
                            hHalf < y ? hHalf : y,
                            this.$$barWidth,
                            hHalf < y ? (y - hHalf) : (hHalf - y)
                        );
                    }
                }

                // draw sample circle
                ctx.fillStyle = this.$$colorSample;
                ctx.beginPath();
                ctx.arc(
                    x + this.$$barSpacingWidth + barMiddle, y,
                    this.$$radius, 0, 2 * Math.PI, false
                );
                ctx.fill();
            }

            this.$$hashOnCanvas = q.getHash();
        };

        SampleChart.prototype.$$initCanvasContext = function () {
            this.$$canvasContext.lineWidth = 1;
        };

        return SampleChart;
    }

})();