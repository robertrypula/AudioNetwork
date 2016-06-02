// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.PowerChart', _PowerChart);

    _PowerChart.$inject = [
        'PhysicalLayer.PowerChartTemplateMain'
    ];

    function _PowerChart(
        PowerChartTemplateMain
    ) {
        var PowerChart;

        PowerChart = function (parentElement, width, height, queue) {
            this.$$parentElement = parentElement;
            this.$$canvas = null;
            this.$$canvasContext = null;
            this.$$canvasWidth = width;
            this.$$canvasHeight = height;
            this.$$queue = queue;
            this.$$destroy = null;
            
            this.$$initAnimationFrame();
            this.$$init();
        };

        PowerChart.prototype.destroy = function () {
            var self = this;

            if (this.$$destroy) {
                return this.$$destroy.promise;
            }

            self.$$destroy = {};
            this.$$destroy.promise = new Promise(function (resolve) {
                self.$$destroy.resolve = resolve;
            });

            return this.$$destroy.promise;
        };

        PowerChart.prototype.$$init = function () {
            this.$$canvasContext = null;
            this.$$parentElement.innerHTML = this.$$renderTemplate();
            this.$$connectTemplate();
            this.$$initCanvasContext();
        };

        // TODO move it to dedicated service
        PowerChart.prototype.$$find = function (selector) {
            var jsObject = this.$$parentElement.querySelectorAll(selector);

            if (jsObject.length === 0) {
                throw 'Cannot $$find given selector';
            }

            return jsObject[0];
        };

        PowerChart.prototype.$$connectTemplate = function () {
            this.$$canvas = this.$$find('.power-chart');
            this.$$canvasContext = this.$$canvas.getContext("2d");
        };

        PowerChart.prototype.$$renderTemplate = function () {
            var tpl = PowerChartTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$canvasWidth).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$canvasHeight).toString());

            return tpl;
        };

        PowerChart.prototype.$$updateChart = function () {
            var
                ctx = this.$$canvasContext,
                q = this.$$queue,
                w = this.$$canvasWidth,
                h = this.$$canvasHeight,
                power, i, x, y
            ;

            if (ctx === null) {
                return;
            }

            ctx.clearRect(0, 0, w, h);

            for (y = 0; y < h; y += 10) {
                ctx.strokeStyle = '#EEE';          // TODO add ability to set colors via configuration object
                ctx.beginPath();
                ctx.moveTo(0, 2 * y);
                ctx.lineTo(w, 2 * y);
                ctx.closePath();
                ctx.stroke();
            }

            for (i = 0; i < q.getSize(); i++) {
                power = q.getItem(i);

                x = i;
                y = -power;

                ctx.fillStyle = '#738BD7';     // TODO add ability to set colors via configuration object
                ctx.fillRect(
                    x - 1,
                    2 * y - 1,
                    3,
                    3
                );
            }
        };

        PowerChart.prototype.$$initCanvasContext = function () {
            this.$$canvasContext.lineWidth = 1;
        };

        PowerChart.prototype.$$initAnimationFrame = function () {
            var self = this;

            function drawAgain() {
                if (self.$$destroy) {
                    self.$$parentElement.innerHTML = '';
                    self.$$destroy.resolve();
                } else {
                    self.$$updateChart();
                    requestAnimationFrame(drawAgain);
                }
            }
            requestAnimationFrame(drawAgain);
        };

        return PowerChart;
    }

})();
