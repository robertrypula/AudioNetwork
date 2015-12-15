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
            analyser,
            analyserMethod = 1 ? 'getByteFrequencyData' : 'getByteTimeDomainData',
            filterEnable = 0,
            chartActive = true;


        function getQ(bandwidth) {
            return Math.sqrt( Math.pow(2, bandwidth) ) / ( Math.pow(2, bandwidth) - 1 );
        }

        function generateAxisXLabel(bufferLength) {
            var resolution = Audio.sampleRate / analyser.fftSize;
            var step = 250;
            var freq;
            var pix;
            var divContent = '';

            console.log(resolution);

            freq = 0;
            while (freq < resolution * bufferLength) {
                pix = Math.round(freq / resolution);
                divContent += '<div style="border-left: 1px solid gray; font-size: 10px; font-family: Tahoma; position: absolute; width: 64px; top: 0px; left: ' + pix + 'px">' + freq + 'Hz</div>';
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
            var filter = Audio.createBiquadFilter();
            var f = 4355;
            var bw = 20;

            ChannelTransmitManager.create([
                1850, 900, 3123
            ]);

            analyser = Audio.createAnalyser();
            analyser.fftSize = 8 * 1024;
            filter.type = 'bandpass';
            filter.frequency.value = f;
            filter.Q.value = f / bw;

            if (filterEnable) {
                ChannelTransmitManager.getGainNode().connect(filter);
                filter.connect(analyser);
            } else {
                ChannelTransmitManager.getGainNode().connect(analyser);
            }
            analyser.connect(Audio.destination);

            console.log('Sampling rate: ', Audio.sampleRate);

            startDrawing();
        }

        
        function addSignal(queue) {
            /*
            queue = [
                { channelIndex: 0, symbol: 1, sampleDuration: 50 }
            ]
            */
        }

        function getSignal() {
            return [
            /*
                { channelIndex: 0, symbol: null, sampleDuration: { start: 344, end: 430 } }
            */
            ];
        }

        function toggleChart() {
            chartActive = !chartActive;
        }

        function toggleTimeFreq() {
            if (analyserMethod == 'getByteFrequencyData') {
                analyserMethod = 'getByteTimeDomainData';
            } else {
                analyserMethod = 'getByteFrequencyData';
            }
        }

        function addQueueTest(channelIndex) {
            var sd = Math.round(Audio.sampleRate * 0.010);

            console.log('queue Added, sd=', sd);

            ChannelTransmitManager.getChannel(channelIndex).addSignalToQueue([
                { symbol: null, sampleDuration: 0.2 * Audio.sampleRate },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 1, sampleDuration: sd },
                { symbol: 0, sampleDuration: sd }
            ]);
        }

        function init() {
            configureNodes();
        }

        init();

        return {
            addSignal: addSignal,
            getSignal: getSignal,
            toggleChart: toggleChart,
            toggleTimeFreq: toggleTimeFreq,
            addQueueTest: addQueueTest
        };
    }

    return new _AudioNetworkDevice();        // TODO change it to dependency injection

})();
