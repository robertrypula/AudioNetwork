var AudioNetworkDevice = (function () {
    'use strict';

    _AudioNetworkDevice.$inject = [];

    function _AudioNetworkDevice() {
        var
            analyser,
            analyserChart,
            channelTransmitManager,
            channelReceiveManager,
            mapping = {
                baseFrequency1000: {
                    index: 0,
                    constellationDiagram: [],
                    queue: []
                },
                baseFrequency3000: {
                    index: 1,
                    constellationDiagram: [],
                    queue: []
                },
                baseFrequency5000: {
                    index: 2,
                    constellationDiagram: [],
                    queue: []
                }
            }
        ;

        function notifyHandler(baseFrequency, carrierData) {
            var state, i, cd, spaces, _, q, powerNormalized;

            _ = mapping['baseFrequency' + baseFrequency];

            spaces = "        ";
            state = (spaces + baseFrequency).slice(-6) + 'Hz | ';
            for (i = 0; i < carrierData.length; i++) {
                q = _.queue[i];

                cd = carrierData[i];
                if (cd.powerDecibel === -Infinity) {
                    cd.powerDecibel = -999;
                }
                if (q) {
                    powerNormalized = (cd.powerDecibel + 40) / 40;
                    powerNormalized = powerNormalized < 0 ? 0 : powerNormalized;
                    if (q.isFull()) {
                        q.pop();
                        q.pop();
                    }
                    q.push(powerNormalized * Math.cos(2 * Math.PI * cd.phase));
                    q.push(powerNormalized * Math.sin(2 * Math.PI * cd.phase));
                }
                state += (
                    (spaces + Math.round(cd.powerDecibel)).slice(-4) + 'dB ' +
                    (spaces + Math.round(cd.phase * 360)).slice(-3) + 'deg ' +
                    ' | '
                );
            }

            document.getElementById('receive-' + _.index).innerHTML = state;
        }

        function configureNodes() {
            var
                queue,
                dftSize = Audio.getSampleRate() * 0.05,
                notificationPerSecond = 25,
                notifyInterval = Audio.getSampleRate() * (1 / notificationPerSecond);

            channelTransmitManager = ChannelTransmitManagerBuilder.build([
                { baseFrequency: 1000, ofdmSize: 1, ofdmFrequencySpacing: 100 },
                { baseFrequency: 3000, ofdmSize: 1, ofdmFrequencySpacing: 100 }
            ]);
            channelReceiveManager = ChannelReceiveManagerBuilder.build([
                {
                    baseFrequency: 1000, ofdmSize: 1, ofdmFrequencySpacing: 100,
                    dftSize: dftSize, notifyInterval: notifyInterval, notifyHandler: notifyHandler
                },
                {
                    baseFrequency: 3000, ofdmSize: 1, ofdmFrequencySpacing: 100,
                    dftSize: dftSize, notifyInterval: notifyInterval, notifyHandler: notifyHandler
                }
            ]);

            queue = QueueBuilder.build(2 * 10);
            mapping.baseFrequency1000.queue.push(queue);
            mapping.baseFrequency1000.constellationDiagram.push(new ConstellationDiagram(document.getElementById('receive-0-cd-0'), queue, 200, 200));

            /*
            queue = QueueBuilder.build(2 * 10);
            mapping.baseFrequency1000.queue.push(queue);
            mapping.baseFrequency1000.constellationDiagram.push(new ConstellationDiagram(document.getElementById('receive-0-cd-1'), queue, 200, 200));
            */

            queue = QueueBuilder.build(2 * 10);
            mapping.baseFrequency3000.queue.push(queue);
            mapping.baseFrequency3000.constellationDiagram.push(new ConstellationDiagram(document.getElementById('receive-1-cd-0'), queue, 200, 200));


            analyser = Audio.createAnalyser();
            analyser.fftSize = 1 * 1024;
            // analyser.minDecibels = -80;
            // analyser.maxDecibels = -40;

            channelTransmitManager.getOutputNode().connect(Audio.destination);

            if (1) {
                Audio.getMicrofoneNode().connect(analyser);
                Audio.getMicrofoneNode().connect(channelReceiveManager.getInputNode());
            } else {
                channelTransmitManager.getOutputNode().connect(analyser);
                channelTransmitManager.getOutputNode().connect(channelReceiveManager.getInputNode());
            }

            document.getElementById('sampling-frequency').innerHTML = Audio.getSampleRate() + 'Hz';

            analyserChart = AnalyserChartBuilder.build(document.getElementById('test'), analyser);
        }

        function addQueueTest(channelIndex, offset) {
            var sd = Math.round(Audio.getSampleRate() * 1.500);

            switch (channelIndex) {
                case 0:
                    channelTransmitManager.getChannel(channelIndex).addToQueue([
                        [{ amplitude: +1.00, duration: sd, phase: +0.000 + offset }]//,
                        //[{ amplitude: +0.25, duration: sd, phase: +0.250 + offset }]
                    ]);
                    break;
                case 1:
                    channelTransmitManager.getChannel(channelIndex).addToQueue([
                        [{ amplitude: +1.00, duration: sd, phase: +0.000 + offset }]
                    ]);
                    break;
            }

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
            getChannelTransmit: getChannelTransmit,
            getChannelReceive: getChannelReceive,
            addQueueTest: addQueueTest  // temporary test method
        };
    }

    return new _AudioNetworkDevice();        // TODO change it to dependency injection

})();
