var AnalyserChart = (function () {
    'use strict';

    _AnalyserChart.$inject = [];

    function _AnalyserChart() {
        var
          AC,
          AXIS_LABEL_X_ONE_ITEM_WITH = 40;
        
        AC = function (parentDiv, analyser) {
            this.$$parentDiv = parentDiv;
            this.$$analyser = analyser;
            this.$$canvas = null;
            this.$$canvasContext = null;
            this.$$canvasWidth = null;
            this.$$canvasHeight = 256;
            this.$$data = null;
            this.$$freezeChart = false;
            this.$$analyserMethod = 'getByteFrequencyData';

            this.$$initAnimationFrame();
            this.$$init();
        };

        AC.prototype.$$init = function () {
            this.$$canvasContext = null;
            this.$$parentDiv.innerHTML = this.$$renderTemplate();
            this.$$connectTemplate();
            this.$$initCanvasContext();
        };

        AC.prototype.$$find = function (selector) {
            var jsObject = this.$$parentDiv.querySelectorAll(selector);

            if (jsObject.length === 0) {
                throw 'Cannot $$find given selector';
            }

            return jsObject[0];
        };

        AC.prototype.$$connectTemplate = function () {
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

        AC.prototype.actionFrequencyTimeDomainToggle = function () {
            if (this.$$analyserMethod === 'getByteFrequencyData') {
                this.$$analyserMethod = 'getByteTimeDomainData';
            } else {
                this.$$analyserMethod = 'getByteFrequencyData';
            }

            this.$$generateAxisX();
        };

        AC.prototype.actionFreezeChart = function () {
            this.$$freezeChart = !this.$$freezeChart;
        };

        AC.prototype.actionChangeFFTSize = function (newFFTSize) {
            this.$$analyser.fftSize = newFFTSize;
            this.$$init();
        };

        AC.prototype.$$renderTemplate = function () {
            var tpl =
                '<div ' +
                '    class="analyser-container" ' +
                '    style="overflow: hidden; width: {{ width }}px; height: 256px; ' +
                '           position: relative; line-height: 10px; font-family: Tahoma; ' +
                '           color: red; font-size: 9px; outline: 1px solid gray;"' +
                '    >' +
                '    <canvas ' +
                '        class="analyser-chart" ' +
                '        style="width: {{ width }}px; height: 256px; position: absolute;" ' +
                '        width="{{ width }}" height="256"' +
                '        ></canvas>' +
                '    <div ' +
                '        class="analyser-action" ' +
                '        style="width: 500px; height: 10px; position: absolute;"' +
                '        >' +
                '        <a href="javascript:void(0)" class="analyser-action-freq-timedomain">Freq/TimeDomain</a>' +
                '        <a href="javascript:void(0)" class="analyser-action-freeze">Freeze</a>' +
                '        <a href="javascript:void(0)" class="analyser-action-fft512">FFT512</a>' +
                '        <a href="javascript:void(0)" class="analyser-action-fft1024">FFT1024</a>' +
                '        <a href="javascript:void(0)" class="analyser-action-fft2048">FFT2048</a>' +
                '        <a href="javascript:void(0)" class="analyser-action-fft4096">FFT4096</a>' +
                '        <a href="javascript:void(0)" class="analyser-action-fft8192">FFT8192</a>' +
                '        <a href="javascript:void(0)" class="analyser-action-fft16384">FFT16384</a>' +
                '    </div>' +
                '    <div ' +
                '        class="analyser-axis-x" ' +
                '        style="position: absolute; bottom: 0px; left: 0px; width: {{ width }}px; height: 10px;"' +
                '        ></div>' +
                '</div>';

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$analyser.frequencyBinCount).toString());

            return tpl;
        };

        AC.prototype.$$renderTemplateAxisXLabel = function (width, left, label) {
            var tpl =
                '<span style="display: block; box-sizing: border-box; border-left: 1px solid gray; ' +
                '             position: absolute; width: {{ width }}px; top: 0px; left: {{ left }}px;"' +
                '    >' +
                '    {{ label }}' +
                '</span>';

            tpl = tpl.replace(/\{\{ width \}\}/, width);
            tpl = tpl.replace(/\{\{ left \}\}/, left);
            tpl = tpl.replace(/\{\{ label \}\}/, label);

            return tpl;
        };

        AC.prototype.$$generateAxisXForTimeDomain = function () {
            var
              availableStep = [ 0.0005, 0.001, 0.002, 0.005, 0.010, 0.025, 0.050, 0.100, 0.250, 0.500 ],
              resolution = Audio.sampleRate,  // [ pix / sec ]
              step = AXIS_LABEL_X_ONE_ITEM_WITH / resolution,
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

            while (time < (this.$$analyser.frequencyBinCount / Audio.sampleRate)) {
                left = Math.round(time * resolution);
                divContent += this.$$renderTemplateAxisXLabel(
                  AXIS_LABEL_X_ONE_ITEM_WITH,
                  left,
                  Math.round(time * 1000) + 'ms'
                );
                time += step;
            }

            return divContent;
        };

        AC.prototype.$$generateAxisXForFrequency = function () {
            var
              availableStep = [ 50, 100, 125, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000 ],
              resolution = this.$$analyser.fftSize / Audio.sampleRate,  // [ pix / Hz ]
              step = AXIS_LABEL_X_ONE_ITEM_WITH / resolution,
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

            while (frequency < 0.5 * Audio.sampleRate) {
                left = Math.round(frequency * resolution);
                divContent += this.$$renderTemplateAxisXLabel(AXIS_LABEL_X_ONE_ITEM_WITH, left, frequency + 'Hz');
                frequency += step;
            }

            return divContent;
        };

        AC.prototype.$$generateAxisX = function () {
            var axisX = this.$$find('.analyser-axis-x');

            if (this.$$analyserMethod == 'getByteFrequencyData') {
                axisX.innerHTML = this.$$generateAxisXForFrequency();
            } else {
                axisX.innerHTML = this.$$generateAxisXForTimeDomain();
            }
        };

        AC.prototype.$$updateChart = function () {
            var 
                length = this.$$data.length,
                ctx = this.$$canvasContext,
                i;

            if (ctx === null || this.$$freezeChart) {
                return;
            }
            ctx.clearRect(0, 0, this.$$canvasWidth, this.$$canvasHeight);
            this.$$analyser[this.$$analyserMethod](this.$$data);
            for (i = 0; i < length; i++) {
                ctx.beginPath();
                ctx.moveTo(i, 255);
                ctx.lineTo(i, 255 - Math.round(this.$$data[i]));
                ctx.closePath();
                ctx.stroke();
            }
        };

        AC.prototype.$$initCanvasContext = function () {
            this.$$data = new Uint8Array(this.$$analyser.frequencyBinCount);
            this.$$generateAxisX();
            this.$$canvasContext.lineWidth = 1;
            this.$$canvasContext.strokeStyle = 'rgba(128, 128, 128, 1)';
        };

        AC.prototype.$$initAnimationFrame = function () {
            var self = this;

            function drawAgain() {
                self.$$updateChart();
                requestAnimationFrame(drawAgain);
            }
            requestAnimationFrame(drawAgain);
        };

        return AC;
    }

    return _AnalyserChart();        // TODO change it to dependency injection

})();
