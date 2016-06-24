// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.AnalyserChart', _AnalyserChart);

    _AnalyserChart.$inject = [
        'Visualizer.AnalyserChartTemplateAxisX',
        'Visualizer.AnalyserChartTemplateMain',
        'Common.SimplePromiseBuilder',
        'Audio.ActiveAudioContext',
        'Common.MathUtil'
    ];

    function _AnalyserChart(
        AnalyserChartTemplateAxisX,
        AnalyserChartTemplateMain,
        SimplePromiseBuilder,
        ActiveAudioContext,
        MathUtil
    ) {
        var AnalyserChart;

        AnalyserChart = function (parentElement, analyser, height, colorData, colorAxis) {
            this.$$parentElement = parentElement;
            this.$$analyser = analyser;
            this.$$canvas = null;
            this.$$canvasContext = null;
            this.$$canvasWidth = null;
            this.$$canvasHeight = height;
            this.$$colorData = colorData;
            this.$$colorAxis = colorAxis;
            this.$$data = null;
            this.$$freezeChart = false;
            this.$$analyserMethod = 'getByteFrequencyData';
            this.$$destroyPromise = null;

            this.$$initAnimationFrame();
            this.$$init();
        };

        AnalyserChart.$$_AXIS_LABEL_X_ONE_ITEM_WITH = 40;

        AnalyserChart.prototype.destroy = function () {
            if (this.$$destroyPromise) {
                return this.$$destroyPromise;
            }
            this.$$destroyPromise = SimplePromiseBuilder.build();

            return this.$$destroyPromise;
        };

        AnalyserChart.prototype.$$init = function () {
            this.$$canvasContext = null;
            this.$$parentElement.innerHTML = this.$$renderTemplate();
            this.$$connectTemplate();
            this.$$initCanvasContext();
        };

        // TODO move it to dedicated service
        AnalyserChart.prototype.$$find = function (selector) {
            var jsObject = this.$$parentElement.querySelectorAll(selector);

            if (jsObject.length === 0) {
                throw 'Cannot $$find given selector';
            }

            return jsObject[0];
        };

        AnalyserChart.prototype.$$connectTemplate = function () {
            var self = this;

            this.$$canvas = this.$$find('.analyser-chart');
            this.$$canvasContext = this.$$canvas.getContext("2d");
            this.$$canvasWidth = this.$$analyser.fftSize;

            this.$$find('.analyser-action-freq-timedomain').addEventListener('click', function () {
                self.actionFrequencyTimeDomainToggle();
            });
            this.$$find('.analyser-action-freeze').addEventListener('click', function () {
                self.actionFreezeChart();
            });
            this.$$find('.analyser-action-fft256').addEventListener('click', function () {
                self.actionChangeFFTSize(256);
            });
            this.$$find('.analyser-action-fft512').addEventListener('click', function () {
                self.actionChangeFFTSize(512);
            });
            this.$$find('.analyser-action-fft1024').addEventListener('click', function () {
                self.actionChangeFFTSize(1024);
            });
            this.$$find('.analyser-action-fft2048').addEventListener('click', function () {
                self.actionChangeFFTSize(2048);
            });
            this.$$find('.analyser-action-fft4096').addEventListener('click', function () {
                self.actionChangeFFTSize(4096);
            });
            this.$$find('.analyser-action-fft8192').addEventListener('click', function () {
                self.actionChangeFFTSize(8192);
            });
            this.$$find('.analyser-action-fft16384').addEventListener('click', function () {
                self.actionChangeFFTSize(16384);
            });
        };

        AnalyserChart.prototype.actionFrequencyTimeDomainToggle = function () {
            if (this.$$analyserMethod === 'getByteFrequencyData') {
                this.$$analyserMethod = 'getByteTimeDomainData';
            } else {
                this.$$analyserMethod = 'getByteFrequencyData';
            }

            this.$$generateAxisX();
        };

        AnalyserChart.prototype.actionFreezeChart = function () {
            this.$$freezeChart = !this.$$freezeChart;
        };

        AnalyserChart.prototype.actionChangeFFTSize = function (newFFTSize) {
            this.$$analyser.fftSize = newFFTSize;
            this.$$init();
        };

        AnalyserChart.prototype.$$renderTemplate = function () {
            var tpl = AnalyserChartTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$analyser.frequencyBinCount).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$canvasHeight).toString());

            return tpl;
        };

        AnalyserChart.prototype.$$renderTemplateAxisXLabel = function (width, left, label) {
            var tpl = AnalyserChartTemplateAxisX.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, width);
            tpl = tpl.replace(/\{\{ left \}\}/g, left);
            tpl = tpl.replace(/\{\{ label \}\}/g, label);
            tpl = tpl.replace(/\{\{ colorAxis \}\}/g, this.$$colorAxis);

            return tpl;
        };

        AnalyserChart.prototype.$$generateAxisXForTimeDomain = function () {
            var
              availableStep = [0.0005, 0.001, 0.002, 0.005, 0.010, 0.025, 0.050, 0.100, 0.250, 0.500],
              resolution = ActiveAudioContext.getSampleRate(),  // [pix/sec]
              step = AnalyserChart.$$_AXIS_LABEL_X_ONE_ITEM_WITH / resolution,
              time = 0,
              left,
              i,
              divContent = '';

            for (i = 0; i < availableStep.length; i++) {
                if (availableStep[i] >= step || i == availableStep.length - 1) {
                    step = availableStep[i];
                    break;
                }
            }

            while (time < (this.$$analyser.frequencyBinCount / ActiveAudioContext.getSampleRate())) {
                left = MathUtil.round(time * resolution);
                divContent += this.$$renderTemplateAxisXLabel(
                  AnalyserChart.$$_AXIS_LABEL_X_ONE_ITEM_WITH,
                  left,
                  MathUtil.round(time * 1000) + 'ms'
                );
                time += step;
            }

            return divContent;
        };

        AnalyserChart.prototype.$$generateAxisXForFrequency = function () {
            var
              availableStep = [50, 100, 125, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000],
              resolution = this.$$analyser.fftSize / ActiveAudioContext.getSampleRate(),  // [pix/Hz]
              step = AnalyserChart.$$_AXIS_LABEL_X_ONE_ITEM_WITH / resolution,
              frequency = 0,
              left,
              i,
              divContent = '';

            for (i = 0; i < availableStep.length; i++) {
                if (availableStep[i] >= step || i == availableStep.length - 1) {
                    step = availableStep[i];
                    break;
                }
            }

            while (frequency < 0.5 * ActiveAudioContext.getSampleRate()) {
                left = MathUtil.round(frequency * resolution);
                divContent += this.$$renderTemplateAxisXLabel(
                    AnalyserChart.$$_AXIS_LABEL_X_ONE_ITEM_WITH,
                    left,
                    frequency + 'Hz'
                );
                frequency += step;
            }

            return divContent;
        };

        AnalyserChart.prototype.$$generateAxisX = function () {
            var axisX = this.$$find('.analyser-axis-x');

            if (this.$$analyserMethod == 'getByteFrequencyData') {
                axisX.innerHTML = '<span>&nbsp;</span>' + this.$$generateAxisXForFrequency();
            } else {
                axisX.innerHTML = '<span>&nbsp;</span>' + this.$$generateAxisXForTimeDomain();
            }
        };

        AnalyserChart.prototype.$$updateChart = function () {
            var 
                length = this.$$data.length,
                ctx = this.$$canvasContext,
                i
            ;

            if (ctx === null || this.$$freezeChart) {
                return;
            }
            ctx.clearRect(0, 0, this.$$canvasWidth, this.$$canvasHeight);
            this.$$analyser[this.$$analyserMethod](this.$$data);
            for (i = 0; i < length; i++) {
                ctx.beginPath();
                ctx.moveTo(i, this.$$canvasHeight);
                ctx.lineTo(
                    i,
                    this.$$canvasHeight - MathUtil.round(this.$$canvasHeight * this.$$data[i] / 255)
                );
                ctx.closePath();
                ctx.stroke();
            }
        };

        AnalyserChart.prototype.$$initCanvasContext = function () {
            this.$$data = new Uint8Array(this.$$analyser.frequencyBinCount);
            this.$$generateAxisX();
            this.$$canvasContext.lineWidth = 1;
            this.$$canvasContext.strokeStyle = this.$$colorData;
        };

        AnalyserChart.prototype.$$initAnimationFrame = function () {
            var self = this;

            function drawAgain() {
                if (self.$$destroyPromise) {
                    self.$$parentElement.innerHTML = '';
                    self.$$destroyPromise.resolve();
                } else {
                    self.$$updateChart();
                    requestAnimationFrame(drawAgain);
                }
            }
            requestAnimationFrame(drawAgain);
        };

        return AnalyserChart;
    }

})();
