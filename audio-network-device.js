var AudioNetworkDevice = (function () {
    'use strict';

    _AudioNetworkDevice.$inject = [];

    function _AudioNetworkDevice() {
        var
            canvas = document.getElementById("theCanvas"),
            div = document.getElementById("theDiv"),
            canvasContext = canvas.getContext("2d"),
            canvasWidth = canvas.width,
            canvasHeight = canvas.height,
            sourceBuffer = null,
            analyser,
            analyserMethod = 0 ? 'getByteFrequencyData' : 'getByteTimeDomainData',
            filterEnable = 0,
            chartActive = true;

        function getQ(bandwidth) {
            return Math.sqrt( Math.pow(2, bandwidth) ) / ( Math.pow(2, bandwidth) - 1 );
        }

        function generateAxisXLabel(bufferLength) {
            var resolution = Audio.sampleRate / analyser.fftSize;
            var step = 1000;
            var freq;
            var pix;
            var divContent = '';

            console.log(resolution);

            freq = 0;
            while (freq < resolution * bufferLength) {
                pix = Math.round(freq / resolution);
                divContent += '<div style="border-left: 1px solid gray; position: absolute; width: 64px; top: 0px; left: ' + pix + 'px">' + freq + 'Hz</div>';
                freq += step;
            }
            if (analyserMethod == 'getByteFrequencyData') {
                div.innerHTML = divContent;
            }
        }

        function startDrawing() {
            var bufferLength = analyser.frequencyBinCount;
            var dataArray = new Uint8Array(bufferLength);

            
            generateAxisXLabel(bufferLength);

            canvasContext.lineWidth = 1;
            canvasContext.strokeStyle = 'rgba(0, 0, 0, 1)';
            function drawAgain() {
                requestAnimationFrame(drawAgain);

                if (!chartActive) {
                    return;
                }
                canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
                analyser[analyserMethod](dataArray);
                for (var i = 0; i < bufferLength; i++) {
                    canvasContext.beginPath();
                    canvasContext.moveTo(i, 255);
                    canvasContext.lineTo(i, 255 - ((i == bufferLength - 1) ? 255 : dataArray[i]));
                    canvasContext.closePath();
                    canvasContext.stroke();
                }
            }

            drawAgain();
        }

        function configureNodes() {
            // var source = Audio.getContext().createBufferSource();
            var filter = Audio.createBiquadFilter();
            var f = 1 ? 2025 : 1070;      // 2025 or 1070
            var bw = 40;
            var test1 = new TransmitChannel(2025);
            var test2 = new TransmitChannel(1070);
            var gainNode = Audio.createGain();

            test1.getLastNode().connect(gainNode);
            test2.getLastNode().connect(gainNode);

            console.log('Sampling rate: ', Audio.sampleRate);

            analyser = Audio.createAnalyser();
            analyser.fftSize = 4 * 1024;

            if (filterEnable) {
                gainNode.connect(filter);
                filter.connect(analyser);
            } else {
                gainNode.connect(analyser);
            }
            analyser.connect(Audio.destination);

            filter.type = 'bandpass';
            filter.frequency.value = f;
            filter.Q.value = f / bw;

            startDrawing();
        }

        
        function addSignal(queue) {
            /*
            queue = [
                { channel: 'A', signal: 1, duration: 50 }
            ]
            */
        }

        function getSignal() {
            return [
                { channel: 'A', signal: null }
            ];
        }

        function toggleChart() {
            chartActive = !chartActive;
        }

        function init() {
            configureNodes();
        }

        init();

        return {
            addSignal: addSignal,
            getSignal: getSignal,
            toggleChart: toggleChart
        };
    }

    return new _AudioNetworkDevice();        // TODO change it to dependency injection

})();
