var AnalyserChart = (function () {
    'use strict';

    _AnalyserChart.$inject = [];

    function _AnalyserChart() {
        var AC;

        AC = function (parentDiv, analyser) {
            this.parentDiv = parentDiv;
            this.analyser = analyser;
            this.canvas = null;
            this.canvasContext = null;
            this.canvasWidth = null;
            this.canvasHeight = 256;
            this.data = null;
            this.freezeChart = false;
            this.analyserMethod = 'getByteFrequencyData';

            this.init();
        };

        AC.prototype.init = function () {
            this.parentDiv.innerHTML = this.renderTemplate();
            this.connectTemplate();
            this.initCanvasContext();
        };

        AC.prototype.connectTemplate = function () {
            var self = this;

            this.canvas = this.parentDiv.querySelectorAll('.analyser-chart')[0];
            this.canvasContext = this.canvas.getContext("2d");
            this.canvasWidth = this.analyser.fftSize;

            this.parentDiv.querySelectorAll('.analyser-action-freq-timedomain')[0].addEventListener('click', function () {
                self.actionFrequencyTimeDomainToggle();
            });
            this.parentDiv.querySelectorAll('.analyser-action-freeze')[0].addEventListener('click', function () {
                self.actionFreezeChart();
            });
            this.parentDiv.querySelectorAll('.analyser-action-fft256')[0].addEventListener('click', function () {
                self.actionChangeFFTSizeTo256();
            });
            this.parentDiv.querySelectorAll('.analyser-action-fft1024')[0].addEventListener('click', function () {
                self.actionChangeFFTSizeTo1024();
            });
            this.parentDiv.querySelectorAll('.analyser-action-fft4096')[0].addEventListener('click', function () {
                self.actionChangeFFTSizeTo4096()
            });
            this.parentDiv.querySelectorAll('.analyser-action-fft16384')[0].addEventListener('click', function () {
                self.actionChangeFFTSizeTo16384();
            });
        };

        AC.prototype.actionFrequencyTimeDomainToggle = function () {
            if (this.analyserMethod === 'getByteFrequencyData') {
                this.analyserMethod = 'getByteTimeDomainData';
            } else {
                this.analyserMethod = 'getByteFrequencyData';
            }
        };

        AC.prototype.actionFreezeChart = function () {
            this.freezeChart = !this.freezeChart;
        };

        AC.prototype.actionChangeFFTSizeTo256 = function () {
            this.analyser.fftSize = 256;
            this.init();
        };

        AC.prototype.actionChangeFFTSizeTo1024 = function () {
            this.analyser.fftSize = 1024;
            this.init();
        };

        AC.prototype.actionChangeFFTSizeTo4096 = function () {
            this.analyser.fftSize = 4096;
            this.init();
        };

        AC.prototype.actionChangeFFTSizeTo16384 = function () {
            this.analyser.fftSize = 16384;
            this.init();
        };

        AC.prototype.renderTemplate = function () {
            var tpl =
                '<div class="analyser-container" style="overflow: hidden; width: {{ vm.width }}px; height: 256px; position: relative; line-height: 10px; font-family: Tahoma; font-size: 9px; outline: 1px solid gray;">' +
                '   <canvas class="analyser-chart" style="width: {{ vm.width }}px; height: 256px; position: absolute;" width="{{ vm.width }}" height="256"></canvas>' +
                '   <div class="analyser-action" style="width: 256px; height: 10px; position: absolute;">' +
                '       <a href="javascript:void(0)" class="analyser-action-freq-timedomain">Freq/TimeDomain</a>' +
                '       <a href="javascript:void(0)" class="analyser-action-freeze">Freeze</a>' +
                '       <a href="javascript:void(0)" class="analyser-action-fft256">FFT256</a>' +
                '       <a href="javascript:void(0)" class="analyser-action-fft1024">FFT1024</a>' +
                '       <a href="javascript:void(0)" class="analyser-action-fft4096">FFT4096</a>' +
                '       <a href="javascript:void(0)" class="analyser-action-fft16384">FFT16384</a>' +
                '   </div>' +
                '   <div class="analyser-axis-x" style="position: absolute; bottom: 0px; left: 0px; width: {{ vm.width }}px; height: 10px;"></div>' +
                '</div>';

            tpl = tpl.replace(/\{\{ vm\.width \}\}/g, this.analyser.fftSize / 2);

            return tpl;
        };

        AC.prototype.generateAxisX = function () {
            var 
                resolution = Audio.sampleRate / this.analyser.fftSize,
                step = 500,
                freq,
                pix,
                divContent = '';

            freq = 0;
            while (freq < resolution * this.data.length) {
                pix = Math.round(freq / resolution);
                divContent += '<div style="border-left: 1px solid gray; position: absolute; width: 64px; top: 0px; left: ' + pix + 'px">' + freq + 'Hz</div>';
                freq += step;
            }
            if (this.analyserMethod == 'getByteFrequencyData') {
                this.parentDiv.querySelectorAll('.analyser-axis-x')[0].innerHTML = divContent;
            } else {
                this.parentDiv.querySelectorAll('.analyser-axis-x')[0].innerHTML = '';
            }
        };

        AC.prototype.updateChart = function () {
            var 
                length = this.data.length,
                ctx = this.canvasContext,
                i;

            if (this.freezeChart) {
                return;
            }
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.analyser[this.analyserMethod](this.data);
            for (i = 0; i < length; i++) {
                ctx.beginPath();
                ctx.moveTo(i, 255);
                ctx.lineTo(i, 255 - this.data[i]);
                ctx.closePath();
                ctx.stroke();
            }
        };

        AC.prototype.initCanvasContext = function () {
            var self = this;

            this.data = new Uint8Array(this.analyser.frequencyBinCount);
            this.generateAxisX();
            this.canvasContext.lineWidth = 1;
            this.canvasContext.strokeStyle = 'rgba(0, 0, 0, 1)';
            function drawAgain() {
                self.updateChart();
                requestAnimationFrame(drawAgain);
            }
            requestAnimationFrame(drawAgain);
        };

        return AC;
    }

    return _AnalyserChart();        // TODO change it to dependency injection

})();
