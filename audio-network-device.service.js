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

        function notifyHandler(baseFrequency, carrierData) {
            var state, i, cd, spaces;

            spaces = "        ";
            state = (spaces + baseFrequency).slice(-6) + 'Hz | ';
            for (i = 0; i < carrierData.length; i++) {
                cd = carrierData[i];
                if (cd.powerDecibel === -Infinity) {
                    cd.powerDecibel = -999;
                }
                state += (
                    (spaces + Math.round(cd.powerDecibel)).slice(-4) + 'dB ' +
                    (spaces + Math.round(cd.phase * 360)).slice(-3) + 'deg ' +
                    ' | '
                );
            }

            document.getElementById('receive-01').innerHTML = state;
        }

        function configureNodes() {
            var
                dftSize = Audio.getSampleRate() * 0.050,
                notificationPerSecond = 10,
                notifyInterval = Audio.getSampleRate() * (1 / notificationPerSecond);

            channelTransmitManager = ChannelTransmitManagerBuilder.build([
                { baseFrequency: 1000, ofdmSize: 4, ofdmFrequencySpacing: 100 }
            ]);
            channelReceiveManager = ChannelReceiveManagerBuilder.build([
                {
                    baseFrequency: 1000, ofdmSize: 4, ofdmFrequencySpacing: 100,
                    dftSize: dftSize, notifyInterval: notifyInterval, notifyHandler: notifyHandler
                }
            ]);

            analyser = Audio.createAnalyser();
            analyser.fftSize = 1 * 1024;
            // analyser.minDecibels = -81;
            // analyser.maxDecibels = -70;

            channelTransmitManager.getOutputNode().connect(Audio.destination);
            channelTransmitManager.getOutputNode().connect(analyser);
            channelTransmitManager.getOutputNode().connect(channelReceiveManager.getInputNode());

            console.log('Sampling rate: ', Audio.getSampleRate());

            analyserChart = AnalyserChartBuilder.build(document.getElementById('test'), analyser);
            //receive01Chart = AnalyserChartBuilder.build(document.getElementById('receive-01'), channelReceiveManager.getChannel(0).analyserStageThrNode);
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
            var sd = Math.round(Audio.getSampleRate() * 1.500);

            channelTransmitManager.getChannel(channelIndex).addToQueue([
                [{ amplitude: +0.25, duration: sd, phase: +0.000 }], // 0
                [{ amplitude: +0.25, duration: sd, phase: +0.250 }], // 1
                [{ amplitude: +0.25, duration: sd, phase: +0.500 }], // 2
                [{ amplitude: +0.25, duration: sd, phase: +0.750 }]  // 3
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
