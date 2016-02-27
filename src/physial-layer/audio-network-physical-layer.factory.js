var AudioNetworkPhysicalLayer = (function () {
    'use strict';

    /*
        TODO development
            + real/imm delete
            + compute at getCarrier
            + index passed into handler
            + decibel power/amplitude check
            + load wav file
            - use dedicated constellation at carrier.html

            -/+ rewrite main API
                + move code to factory
                + cleanup inside main service
                - ability to change frequency
                - internal notifyHandler for constellation update, external for user purposes
                - add ability to choose destination source
                - fix recorded file loading logic
                - fix history point colors
                - add rx method outside the factory

        TODO performance
            - move script processor node to receive manager
            - do not redraw constellation if queue wasn't changed
            - move sin/cos to internal Math service (to give ability to quickly add lookup tables)
    */

    _AudioNetworkPhysicalLayer.$inject = [];

    function _AudioNetworkPhysicalLayer() {
        var ANPL;

        ANPL = function (configuration) {
            this.$$configuration = AudioNetworkPhysicalLayerConfiguration.parse(configuration);
            this.$$channelTransmitManager = null;
            this.$$channelReceiveManager = null;
            this.$$currentInput = null;
            this.$$rxAnalyser = null;
            this.$$rxAnalyserChart = null;
            this.$$rxConstellationDiagram = [];

            this.$$initTx();
            this.$$initRx();
            this.setRxInput(this.$$configuration.rx.input);
        };

        ANPL.prototype.$$notifyHandler = function (index, carrierData) {
            return;
            var state, i, cd, spaces, _, q, powerNormalized;

            _ = this.$$rxConstellationDiagram[index];
            spaces = "             ";
            state = "";//(spaces + baseFrequency).slice(-10) + 'Hz | ';
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

            document.getElementById('receive-' + index).innerHTML = state;
        };

        ANPL.prototype.$$initTx = function () {
            this.$$channelTransmitManager = ChannelTransmitManagerBuilder.build(
                this.$$configuration.tx.channel
            );
            this.$$channelTransmitManager.getOutputNode().connect(Audio.getDestination()); // TODO change it later
        };

        ANPL.prototype.$$initRx = function () {
            var
                dftSize = Audio.getSampleRate() * this.$$configuration.rx.dftTimeSpan,
                notifyInterval = Audio.getSampleRate() / this.$$configuration.rx.notificationPerSecond,
                channelList = [],
                channel, i, j, queue, constellationDiagram
            ;

            for (i = 0; i < this.$$configuration.rx.channel.length; i++) {
                channel = this.$$configuration.rx.channel[i];
                channel.dftSize = dftSize;
                channel.notifyInterval = notifyInterval;
                channel.notifyHandler = this.$$notifyHandler.bind(this);
                channelList.push(channel);

                queue = [];
                constellationDiagram = [];
                for (j = 0; j < channel.ofdmSize; j++) {
                    queue.push(
                        QueueBuilder.build(2 * this.$$configuration.rx.constellationDiagram.historyPointSize)
                    );
                    /*
                    constellationDiagram.push(
                        ConstellationDiagramBuilder.build(
                            //parentElement, queue, width, height, colorAxis, colorHistoryPoint
                        )
                    );
                    */
                }
                this.$$rxConstellationDiagram.push({
                    queue: queue,
                    constellationDiagram: constellationDiagram
                });
            }
            this.$$channelReceiveManager = ChannelReceiveManagerBuilder.build(channelList);

            this.$$rxAnalyser = Audio.createAnalyser();
            this.$$rxAnalyser.fftSize = this.$$configuration.rx.spectrum.fftSize;
            this.$$rxAnalyser.connect(this.$$channelReceiveManager.getInputNode());
            if (this.$$configuration.rx.spectrum.elementId) {
                this.$$rxAnalyserChart = AnalyserChartBuilder.build(
                    document.getElementById(this.$$configuration.rx.spectrum.elementId),
                    this.$$rxAnalyser,
                    this.$$configuration.rx.spectrum.height,
                    this.$$configuration.rx.spectrum.color.data,
                    this.$$configuration.rx.spectrum.color.axis
                );
            }
        };

        ANPL.prototype.$$getTxInputNode = function (input) {
            var node = null;

            switch (input) {
                case AudioNetworkPhysicalLayerConfiguration.INPUT.MICROPHONE:
                    node = Audio.getMicrophoneNode();
                    break;
                case AudioNetworkPhysicalLayerConfiguration.INPUT.RECORDED_FILE:
                    node = Audio.getRecordedNode();
                    break;
                case AudioNetworkPhysicalLayerConfiguration.INPUT.RX_LOOPBACK:
                    node = this.$$channelTransmitManager.getOutputNode();
                    break;
            }

            return node;
        };

        ANPL.prototype.setRxInput = function (input) {
            var node;

            if (this.$$currentInput) {
                this.$$getTxInputNode(this.$$currentInput).disconnect(this.$$rxAnalyser);
            }

            node = this.$$getTxInputNode(input);
            if (node) {
                node.connect(this.$$rxAnalyser);
                this.$$currentInput = input;
            } else {
                this.$$currentInput = null;
            }
        };

        ANPL.prototype.tx = function (channelIndex, data) {
            var
                channelTx = this.$$channelTransmitManager.getChannel(channelIndex),
                d, i, dataParsed = []
            ;

            if (!data) {
                throw 'Please specify data to send';
            }

            for (i = 0; i < data.length; i++) {
                d = data[i];
                dataParsed.push({
                    amplitude: d.amplitude || 1,
                    duration: Math.round(
                        Audio.getSampleRate() * (d.duration || 0.200)
                    ),
                    phase: d.phase || 0
                });
            }

            channelTx.addToQueue(dataParsed);
        };

        ANPL.prototype.getSampleRate = function () {
            return Audio.getSampleRate();
        };

        ANPL.prototype.destroy = function () {
            this.setRxInput(null);

            // rx
            if (this.$$rxAnalyserChart) {
                this.$$rxAnalyserChart.destroy();
                this.$$rxAnalyserChart = null;
            }
            this.$$rxAnalyser.disconnect(this.$$channelReceiveManager.getInputNode());
            this.$$channelReceiveManager.destroy();
            this.$$channelReceiveManager = null;

            // tx
            this.$$channelTransmitManager.getOutputNode().disconnect(Audio.getDestination()); // TODO change it later
            this.$$channelTransmitManager.destroy();
            this.$$channelTransmitManager = null;
        };

        return ANPL;
    }

    return _AudioNetworkPhysicalLayer();        // TODO change it to dependency injection

})();
