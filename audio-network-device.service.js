var AudioNetworkDevice = (function () {
    'use strict';

    _AudioNetworkDevice.$inject = [];

    function _AudioNetworkDevice() {
        var
            analyser,
            filterEnable = 0,
            analyserChart,
            channelTransmitManager;

        function configureNodes() {
            var filter = Audio.createBiquadFilter();
            var f = 4355;
            var bw = 20;

            channelTransmitManager = ChannelTransmitManagerBuilder.build([
                2000, 900, 5000
            ]);

            analyser = Audio.createAnalyser();
            analyser.fftSize = 4 * 1024;
            filter.type = 'bandpass';
            filter.frequency.value = f;
            filter.Q.value = f / bw;

            if (filterEnable) {
                channelTransmitManager.getGainNode().connect(filter);
                filter.connect(analyser);
            } else {
                channelTransmitManager.getGainNode().connect(analyser);
            }
            analyser.connect(Audio.destination);

            console.log('Sampling rate: ', Audio.sampleRate);

            analyserChart = AnalyserChartBuilder.build(document.getElementById('test'), analyser);
        }

        
        function addSignal(queue) {
            /*
            queue = [
                { channelIndex: 0, symbol: 1, duration: 50 }
            ]
            */
        }

        function getSignal() {
            return [
            /*
                { channelIndex: 0, symbol: null, duration: { start: 344, end: 430 } }
            */
            ];
        }

        function addQueueTest(channelIndex) {
            var sd = Math.round(Audio.sampleRate * 0.010);

            console.log('queue Added, sd=', sd);

            channelTransmitManager.getChannel(channelIndex).addSignalToQueue([
                { symbol: null, duration: 0.2 * Audio.sampleRate },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 1, duration: sd },
                { symbol: 0, duration: sd }
            ]);
        }

        function getChannelTransmit(channelIndex) {
            return channelTransmitManager.getChannel(channelIndex);
        }

        function init() {
            configureNodes();
        }

        init();

        return {
            addSignal: addSignal,
            getSignal: getSignal,
            addQueueTest: addQueueTest,
            getChannelTransmit: getChannelTransmit
        };
    }

    return new _AudioNetworkDevice();        // TODO change it to dependency injection

})();
