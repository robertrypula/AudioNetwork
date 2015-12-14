window.AudioContext = window.AudioContext || window.webkitAudioContext;

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

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
            analyserMethod = 1 ? 'getByteFrequencyData' : 'getByteTimeDomainData',
            filterEnable = 1,
            chartActive = true;

        function initializeSourceBuffer(url) {
            var request = new XMLHttpRequest();

            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            request.onload = function () {
                Audio.getContext().decodeAudioData(
                    request.response,
                    function (buffer) {
                        sourceBuffer = buffer;
                        configureNodes();
                    },
                    function () {
                        console.log('error');
                    }
                );
            };
            request.send();
        }

        function getQ(bandwidth) {
            return Math.sqrt( Math.pow(2, bandwidth) ) / ( Math.pow(2, bandwidth) - 1 );
        }

        function startDrawing() {
            var bufferLength = analyser.frequencyBinCount;
            var dataArray = new Uint8Array(bufferLength);
            var resolution = Audio.sampleRate / analyser.fftSize;
            var step = 1000;
            var freq;
            var pix;
            var divContent = '';

            canvasContext.lineWidth = 1;
            canvasContext.strokeStyle = 'rgba(0, 0, 0, 1)';

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
            var source = Audio.getContext().createBufferSource();
            var filter = Audio.createBiquadFilter();
            var oscillator = Audio.createOscillator();
            var f = 2500;// 1 ? 2025 : 1070;      // 2025 or 1070
            var bw = 200;

            oscillator.type = 'sine';
            oscillator.frequency.value = 1000; // value in hertz
            oscillator.start(0);

            analyser = Audio.createAnalyser();
            analyser.fftSize = 4 * 1024;//16384;

            console.log('Sampling rate: ', Audio.sampleRate);

            source.buffer = sourceBuffer;

            console.log('Sampling rate: ', Audio.sampleRate);

            if (filterEnable) {
                //oscillator.connect(filter);
                source.connect(filter);
                filter.connect(analyser);
            } else {
                //oscillator.connect(analyser);
                source.connect(analyser);
            }
            //analyser.connect(Audio.destination);

            /*
            filter.type = 'bandpass'; // Low-pass filter. See BiquadFilterNode docs
            filter.frequency.value = 1200; // Set cutoff to 440 HZ
            filter.Q.value = 40;
            */

            filter.type = 'bandpass';
            filter.frequency.value = f;
            filter.Q.value = f / bw;

            source.start(0);                           // play the source now
            startDrawing();

            var test1 = new TransmitChannel(1000);
            var test2 = new TransmitChannel(2000);

            test1.getLastNode().connect(Audio.destination);
        }

        /*
            queue = [
                {
                    channel: 'A',
                    signal: 1,
                    duration: 50        // in miliseconds
                },
                {
                    channel: 'A',
                    signal: 2,
                    duration: 50        // in miliseconds
                },
                {
                    channel: 'B',
                    signal: 1,
                    duration: 500       // in miliseconds
                }
            ]

        */
        function addSignal(queue) {

        }

        function getSignal() {
            return [
                {
                    channel: 'A',
                    signal: null
                },
                {
                    channel: 'B',
                    signal: 1
                }
            ]
        }

        function toggleChart() {
            chartActive = !chartActive;
        }

        function init() {
            // initializeSourceBuffer('test_2025KHz_and_1070KHz_200bps_1010.wav');
            initializeSourceBuffer('wave_1000Hz_and_2500Hz.wav');
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
