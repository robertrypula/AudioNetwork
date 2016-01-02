var AudioNetworkDevice = (function () {
    'use strict';

    _AudioNetworkDevice.$inject = [];

    function _AudioNetworkDevice() {
        var
            analyser,
            analyserChart,
            receive01Chart,
            receive02Chart,
            receive03Chart,
            channelTransmitManager,
            channelReceiveManager;

        function configureNodes() {
            channelTransmitManager = ChannelTransmitManagerBuilder.build([
                573, 900, 5000
            ]);
            channelReceiveManager = ChannelReceiveManagerBuilder.build([
                573//, 900, 5000
            ]);

            analyser = Audio.createAnalyser();
            analyser.fftSize = 1 * 1024;

            channelTransmitManager.getOutputNode().connect(analyser);
            analyser.connect(Audio.destination);
            channelTransmitManager.getOutputNode().connect(channelReceiveManager.getInputNode());

            console.log('Sampling rate: ', Audio.sampleRate);

            analyserChart = AnalyserChartBuilder.build(document.getElementById('test'), analyser);
            receive01Chart = AnalyserChartBuilder.build(document.getElementById('receive-01'), channelReceiveManager.getChannel(0).analyserStageThrNode);
            //receive02Chart = AnalyserChartBuilder.build(document.getElementById('receive-02'), channelReceiveManager.getChannel(1).analyserStageThrNode);
            //receive03Chart = AnalyserChartBuilder.build(document.getElementById('receive-03'), channelReceiveManager.getChannel(2).analyserStageThrNode);
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

        function getChannelReceive(channelIndex) {
            return channelReceiveManager.getChannel(channelIndex);
        }

        function init() {
            configureNodes();
        }

        init();

        return {
            addSignal: addSignal,
            getSignal: getSignal,
            getChannelTransmit: getChannelTransmit,
            getChannelReceive: getChannelReceive,

            // test methods
            addQueueTest: addQueueTest
        };
    }

    return new _AudioNetworkDevice();        // TODO change it to dependency injection

})();
