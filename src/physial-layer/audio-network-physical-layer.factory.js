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
            - refactor DOM helpers (move to service)
            - check inverse phase shift issue
            - add auto tuning feature
            - add getOutput* methods
            - add outputTxEnable/outputTxDisable methods

            + rewrite main API
                + move code to factory
                + cleanup inside main service
                + internal notifyHandler for constellation update, external for user purposes
                + add rx method outside the factory
                + destroy constellation
                + ability to change frequency
                + fix recorded file loading logic
                + fix history point colors
                + add ability to choose destination source

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
            this.$$rxHandler = null;
            this.$$outputMicrophone = undefined;
            this.$$outputRecordedAudio = undefined;

            this.$$initTx();
            this.$$initRx();
            this.setRxInput(this.$$configuration.rx.input);
        };

        ANPL.prototype.$$notifyHandler = function (channelIndex, carrierData) {
            var i, cd, queue, powerNormalized;

            for (i = 0; i < carrierData.length; i++) {
                cd = carrierData[i];
                if (cd.powerDecibel === -Infinity) {
                    cd.powerDecibel = -99;
                }
                cd.powerDecibel = cd.powerDecibel < -99 ? -99 : cd.powerDecibel;

                if (this.$$rxConstellationDiagram.length === 0) {
                    continue;
                }

                queue = this.$$rxConstellationDiagram[channelIndex].queue[i];
                powerNormalized = (cd.powerDecibel + 40) / 40;
                powerNormalized = powerNormalized < 0 ? 0 : powerNormalized;
                if (queue.isFull()) {
                    queue.pop();
                    queue.pop();
                }
                queue.push(powerNormalized * Math.cos(2 * Math.PI * cd.phase));
                queue.push(powerNormalized * Math.sin(2 * Math.PI * cd.phase));
            }

            if (this.$$rxHandler) {
                this.$$rxHandler(channelIndex, carrierData);
            }
        };

        ANPL.prototype.$$initTx = function () {
            this.$$channelTransmitManager = ChannelTransmitManagerBuilder.build(
                this.$$configuration.tx.channel
            );
            this.$$channelTransmitManager.getOutputNode().connect(Audio.getDestination());

            this.outputMicrophoneDisable();
            this.outputRecordedAudioEnable();
        };

        ANPL.prototype.$$initConstellationDiagram = function (channelIndex, channel) {
            var ofdmIndex, queue, constellationDiagram, elementId;

            queue = [];
            constellationDiagram = [];
            for (ofdmIndex = 0; ofdmIndex < channel.ofdmSize; ofdmIndex++) {
                elementId = this.$$configuration.rx.constellationDiagram.elementId;
                elementId = elementId.replace('{{ channelIndex }}', channelIndex + '');
                elementId = elementId.replace('{{ ofdmIndex }}', ofdmIndex + '');
                if (!document.getElementById(elementId)) {
                    throw 'Constellation diagram DOM element not found';
                }

                queue.push(
                    QueueBuilder.build(2 * this.$$configuration.rx.constellationDiagram.historyPointSize)
                );
                constellationDiagram.push(
                    ConstellationDiagramBuilder.build(
                        document.getElementById(elementId),
                        queue[queue.length - 1],
                        this.$$configuration.rx.constellationDiagram.width,
                        this.$$configuration.rx.constellationDiagram.height,
                        this.$$configuration.rx.constellationDiagram.color.axis,
                        this.$$configuration.rx.constellationDiagram.color.historyPoint
                    )
                );
            }
            this.$$rxConstellationDiagram.push({
                constellationDiagram: constellationDiagram,
                queue: queue
            });
        };

        ANPL.prototype.$$initRx = function () {
            var
                dftSize = Audio.getSampleRate() * this.$$configuration.rx.dftTimeSpan,
                notifyInterval = Audio.getSampleRate() / this.$$configuration.rx.notificationPerSecond,
                channelList = [],
                channel, i
            ;

            for (i = 0; i < this.$$configuration.rx.channel.length; i++) {
                channel = this.$$configuration.rx.channel[i];
                channel.dftSize = dftSize;
                channel.notifyInterval = notifyInterval;
                channel.notifyHandler = this.$$notifyHandler.bind(this);
                channelList.push(channel);

                if (this.$$configuration.rx.constellationDiagram.elementId) {
                    this.$$initConstellationDiagram(i, channel);
                }
            }
            this.$$channelReceiveManager = ChannelReceiveManagerBuilder.build(channelList);

            this.$$rxAnalyser = Audio.createAnalyser();
            this.$$rxAnalyser.fftSize = this.$$configuration.rx.spectrum.fftSize;
            this.$$rxAnalyser.connect(this.$$channelReceiveManager.getInputNode());
            if (this.$$configuration.rx.spectrum.elementId) {
                if (!document.getElementById(this.$$configuration.rx.spectrum.elementId)) {
                    throw 'Spectrum DOM element not found';
                }
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

        ANPL.prototype.loadRecordedAudio = function (url, successCallback, errorCallback) {
            Audio.loadRecordedAudio(url, successCallback, errorCallback);
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
                dataParsed.push([{
                    amplitude: (typeof d.amplitude !== 'undefined') ? d.amplitude : 1,
                    duration: Math.round(
                        Audio.getSampleRate() * (d.duration || 0.200)
                    ),
                    phase: (typeof d.phase !== 'undefined') ? d.phase : 0
                }]);
            }

            channelTx.addToQueue(dataParsed);
        };

        ANPL.prototype.rx = function (rxHandler) {
            this.$$rxHandler = (
                (typeof rxHandler === 'function') ?
                rxHandler :
                null
            );
        };

        ANPL.prototype.getSampleRate = function () {
            return Audio.getSampleRate();
        };

        ANPL.prototype.destroy = function () {
            var i, j;

            this.setRxInput(null);

            // rx
            if (this.$$rxAnalyserChart) {
                this.$$rxAnalyserChart.destroy();
                this.$$rxAnalyserChart = null;
            }
            this.$$rxAnalyser.disconnect(this.$$channelReceiveManager.getInputNode());
            if (this.$$rxConstellationDiagram) {
                for (i = 0; i < this.$$rxConstellationDiagram.length; i++) {
                    for (j = 0; j < this.$$rxConstellationDiagram[i].constellationDiagram.length; j++) {
                        this.$$rxConstellationDiagram[i].constellationDiagram[j].destroy();
                    }
                }
            }
            this.$$channelReceiveManager.destroy();
            this.$$channelReceiveManager = null;

            // tx
            this.$$channelTransmitManager.getOutputNode().disconnect(Audio.getDestination());
            this.outputRecordedAudioDisable();
            this.outputMicrophoneDisable();
            this.$$channelTransmitManager.destroy();
            this.$$channelTransmitManager = null;
        };

        ANPL.prototype.outputMicrophoneEnable = function () {
            if (!this.$$outputMicrophone) {
                Audio.getMicrophoneNode().connect(Audio.getDestination());
            }
            this.$$outputMicrophone = true;
        };

        ANPL.prototype.outputMicrophoneDisable = function () {
            if (this.$$outputMicrophone) {
                Audio.getMicrophoneNode().disconnect(Audio.getDestination());
            }
            this.$$outputMicrophone = false;
        };

        ANPL.prototype.outputRecordedAudioEnable = function () {
            if (!this.$$outputRecordedAudio) {
                Audio.getRecordedNode().connect(Audio.getDestination());
            }
            this.$$outputRecordedAudio = true;
        };

        ANPL.prototype.outputRecordedAudioDisable = function () {
            if (this.$$outputRecordedAudio) {
                Audio.getRecordedNode().disconnect(Audio.getDestination());
            }
            this.$$outputRecordedAudio = false;
        };

        ANPL.prototype.getRxFrequency = function (channelIndex, ofdmIndex) {
            return (
                this.$$channelReceiveManager
                    .getChannel(channelIndex)
                    .getFrequency(ofdmIndex)
            );
        };

        ANPL.prototype.getTxFrequency = function (channelIndex, ofdmIndex) {
            return (
                this.$$channelTransmitManager
                .getChannel(channelIndex)
                .getFrequency(ofdmIndex)
            );
        };

        ANPL.prototype.setRxFrequency = function (channelIndex, ofdmIndex, frequency) {
            this.$$channelReceiveManager
                .getChannel(channelIndex)
                .setFrequency(ofdmIndex, frequency)
            ;
        };

        ANPL.prototype.setTxFrequency = function (channelIndex, ofdmIndex, frequency) {
            this.$$channelTransmitManager
                .getChannel(channelIndex)
                .setFrequency(ofdmIndex, frequency)
            ;
        };

        return ANPL;
    }

    return _AudioNetworkPhysicalLayer();        // TODO change it to dependency injection

})();
