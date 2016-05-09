(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.PhysicalLayer', _PhysicalLayer);

    /*
        KNOWN ISSUES:
            + for some dftWindowTime after converting it to numbers of samples CarrierRecovery queue size is fractional

        TODO
            + real/imm delete
            + compute at getCarrierDetail
            + index passed into handler
            + decibel power/amplitude check
            + load wav file
            + add getOutput* methods
            + add outputTxEnable/outputTxDisable methods
            + check inverse phase shift issue
            + add script node sample to config
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
            + move script processor node to receive manager
            + move sin/cos to internal Math service (to give ability to quickly add lookup tables)
            + fix layout
            + add phase offset input to align symbol '0'
            + add html generation as js + ofdm support
            + change send logic (add amplitude, symbolCount, symbol to each OFDM block)
            + change send sequence logic (use format: '5.5.2.0 1.2.4.1')
            + add DFT time span to config
            + internal loop for notifications
                 + add script node block time (from audiocontext)
                 + add sample offset time from script node block time
            + add symbol config to rx
            + prefill amplitude value basing on ofdm size at channel tx
            + add symbol detection to rx
            + move example code related to html generation to separate file with comment
            + add buttons for symbols (TX)
            + add squares with symbol number (RX)
            + update sequence textarea after pskSize change
            + rename delay-loop-handler
            + after psk change only related tx/rx should be updated
            + add rx/tx to channel headers
            + change 'frame' to 'packet'
            + add 'Send sync signal' to TX
            + ability to hide some of the widgets: 'Easy' and 'Advanced' view
            + fix styles
                + add source button active class
                + improve responsive design
            + add margin to sections
            + use first symbol of each packet to fine tune phase offset (add checkbox for that feature)
            + add inter-packet gap duration

            + add quick configs like: 'baud-5, ofdm-1, psk-2' or 'baud-20, ofdm-16, psk-2' or ...
                + add checkbox for tx/rx config
                + add callback to destroy
                + add bit speed information at UI

            + refactor all transmit and receive logic (move it to physical layer internals)
                + [TX] remove symbol generation from template-util
                + [TX] symbol shouldn't have any guard interval or/and interpacket gap

                + [RX] add setTimes* methods (maybe it's worth to add some error margin - times inside are for internal adapter use)
                + [RX] add setSyncPreamble(true/false) method
                + [RX] add packet receive handler packetReceived(data)
                + [RX] add multiple channels support (introduce new class in the middle)
                next steps:
                    + set threshold to very low value (-100 dB) to force idle state for a while
                    + compute average noise level power at idle state
                    + after noise level is set raise threshold xx dB above noise level
                    + so far do not collect symbol and packet data (wait for sync)
                    + run sync on the TX side
                    + sync state will be detected - grab average max signal strength
                    + subtract 10 decibels from max signal and enable symbol/packet collecting
                + [RX] add method to reset receiver state machine (to follow steps above again)
                + [RX] double check state times at receive adapter
                    + move sync time to main adapter class
                    + check symbol, guard times
                    + average sample sizes should be config dependent (mostly for samplesPerSecond setting)
                + [RX] grab/clean packet data and notify packet handler
            
            - Receive Adapter:  [6.5h or 12.5h remaining] ~ 5 evenings or 7 evenings
                + [1.5h] add events for frequency update and phase update to notify hosting code
                + [2.0h] refactor 'collecting arrays' to dedicated collectors
                - [2.0h] refactor data/packet collection to dedicates collectors classes
                    - change SYMBOL state name to PILOT_SIGNAL
                    - change ERROR state name to SYNC_TO_LONG
                    - phaseOffsetCollector -> frequencyErrorCollector
                    - introduce some phaseErrorCollector ?
                - [3.0h] test and fix multiple OFDM support, first ofdm index would be pilot signal
                - OPTIONAL [1.5h] adaptive threshold based on arriving packets (add history to Signal/Guard Collectors based on Queue class)
                - OPTIONAL [4.0h] add auto tuning feature with ability to align phase offset (improve phase-offset-collector class)
                - OPTIONAL [1.0h] Signal Strength like in cell phones
                - OPTIONAL [1.0h] add new state: INTERPACKET_GAP

            - Power chart:      [10.5h remaining]
                - [4.0h] integrate with rest of the code (pass configuration to receive adapter constructor), config: elementId, colors, ...?
                - [3.0h] ability to show other OFDMs than pilot
                - [1.0h] increase bar width
                - [1.5h] mark states ranges
                - [1.0h] show important power level (threshold, min/max, etc)

            - Finalization easy:
                + fix typo: physial-layer into physical-layer
                + keep view type after reinitialization
                + remove audio-network prefix from main classes names
                + change name: dftTimeSpan -> dftWindowTimeSpan
                + move general configuration to some common service

                + refactor NO_SIGNAL state
                + change input TX to LOOPBACK
                + move templates code to dedicated files
                + introduce Dependency Injection
                - remove Promises
                - use setTimeout instead setInverval (?)
                - prepare release version + some code minification

            - Finalization complex:
                + measure CPU load by measuring times before and after execution
                - wrap with dedicated class JS methods like requestAnimationFrame, setTimeout, setInterval
                - refactor DOM helpers (move to service)
                - do not redraw constellation if queue wasn't changed
                - ability to add hooks at sample generation and receive (inject some changes to signal)
                - refactor sample handling and generation to order to easily move that code to Service Worker

        TODO (carrier.html)
            - use dedicated constellation


1  1  0  1  11
0  1  1  0  10
0  1  0  0  01
0  1  0  1  10

01 11 01 10

D6 45

8 subcarriers   
3 bit/baud (PSK-8)
3 baud (120ms symbol, 213.3ms guard)     14700 = 5292 + 9408  (@44100)
=
72 bit/sec = 9 B/sec       ->   1,125 B/sec per subcarrier


#####_________#####_________



SYNC_ZERO | ADDR_SRC | ADDR_DEST | LENGTH | data .... data | SHA1[first 2 bytes] | ECC

            1 B         1 B          1 B       0...255 B         2 B


    */

    _PhysicalLayer.$inject = [
        'Common.QueueBuilder',
        'Common.MathUtil',
        'PhysicalLayer.ConfigurationParser',
        'PhysicalLayer.RxInput',
        'PhysicalLayer.RxHandlerBuilder',
        'PhysicalLayer.ChannelTransmitManagerBuilder',
        'PhysicalLayer.ChannelReceiveManagerBuilder',
        'PhysicalLayer.ConstellationDiagramBuilder',
        'PhysicalLayer.AnalyserChartBuilder',
        'PhysicalLayer.Audio'
    ];

    function _PhysicalLayer(
        QueueBuilder,
        MathUtil,
        ConfigurationParser,
        RxInput,
        RxHandlerBuilder,
        ChannelTransmitManagerBuilder,
        ChannelReceiveManagerBuilder,
        ConstellationDiagramBuilder,
        AnalyserChartBuilder,
        Audio
    ) {
        var PL;

        PL = function (configuration) {
            this.$$configuration = ConfigurationParser.parse(configuration);
            this.$$channelTransmitManager = null;
            this.$$channelReceiveManager = null;
            this.$$currentInput = null;
            this.$$rxAnalyser = null;
            this.$$rxAnalyserChart = null;
            this.$$rxConstellationDiagram = [];

            this.$$outputTx = undefined;
            this.$$outputMicrophone = undefined;
            this.$$outputRecordedAudio = undefined;
            this.$$rxExternalHandler = {
                callback: null
            };
            this.$$rxHandler = RxHandlerBuilder.build(
                this.$$rxConstellationDiagram,
                this.$$rxExternalHandler
            );

            this.$$initTx();
            this.$$initRx();
            this.setRxInput(this.$$configuration.rx.input);
        };

        PL.prototype.$$initTx = function () {
            this.$$channelTransmitManager = ChannelTransmitManagerBuilder.build(
                this.$$configuration.tx.channel,
                this.$$configuration.tx.bufferSize
            );

            this.outputTxEnable();
            this.outputMicrophoneDisable();
            this.outputRecordedAudioDisable();
        };

        PL.prototype.$$initConstellationDiagram = function (channelIndex, channel) {
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

        PL.prototype.$$initRx = function () {
            var
                dftWindowSize = MathUtil.round(Audio.getSampleRate() * this.$$configuration.rx.dftWindowTime),
                notifyInterval = MathUtil.round(Audio.getSampleRate() / this.$$configuration.rx.notificationPerSecond),
                channel, i
            ;

            for (i = 0; i < this.$$configuration.rx.channel.length; i++) {
                channel = this.$$configuration.rx.channel[i];

                // attach additional fields to channel object
                channel.dftWindowSize = dftWindowSize;
                channel.notifyInterval = notifyInterval;
                channel.notifyHandler = this.$$rxHandler.handle.bind(this.$$rxHandler);

                if (this.$$configuration.rx.constellationDiagram.elementId) {
                    this.$$initConstellationDiagram(i, channel);
                }
            }
            this.$$channelReceiveManager = ChannelReceiveManagerBuilder.build(
                this.$$configuration.rx.channel,
                this.$$configuration.rx.bufferSize
            );

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

        PL.prototype.$$getTxInputNode = function (input) {
            var node = null;

            switch (input) {
                case RxInput.MICROPHONE:
                    node = Audio.getMicrophoneNode();
                    break;
                case RxInput.LOOPBACK:
                    node = this.$$channelTransmitManager.getOutputNode();
                    break;
                case RxInput.RECORDED_AUDIO:
                    node = Audio.getRecordedAudioNode();
                    break;
            }

            return node;
        };

        PL.prototype.getRxInput = function () {
            return this.$$currentInput;
        };

        PL.prototype.setRxInput = function (input) {
            var node;

            if (this.$$currentInput) {
                this.$$getTxInputNode(this.$$currentInput).disconnect(this.$$rxAnalyser);
            }

            node = this.$$getTxInputNode(input);
            if (node) {
                node.connect(this.$$rxAnalyser);
                this.$$currentInput = input;
                if (this.$$currentInput === RxInput.LOOPBACK) {
                    this.$$channelTransmitManager.enableFakeNoise();
                } else {
                    this.$$channelTransmitManager.disableFakeNoise();
                }
            } else {
                this.$$currentInput = null;
            }
        };

        PL.prototype.getTxBufferSize = function () {
            return this.$$channelTransmitManager.getBufferSize();
        };

        PL.prototype.getRxBufferSize = function () {
            return this.$$channelReceiveManager.getBufferSize();
        };

        PL.prototype.loadRecordedAudio = function (url, successCallback, errorCallback) {
            Audio.loadRecordedAudio(url, successCallback, errorCallback);
        };

        PL.prototype.tx = function (channelIndex, data) {
            var
                channelTx = this.$$channelTransmitManager.getChannel(channelIndex),
                d, i, dataParsed = []
            ;

            if (!data) {
                throw 'Please specify data to send';
            }

            for (i = 0; i < data.length; i++) {
                d = data[i];
                if (!d.duration) {
                    throw 'Tx - duration of all data items should be > 0';
                }

                dataParsed.push([{
                    amplitude: (typeof d.amplitude !== 'undefined') ? d.amplitude : 1,
                    duration: MathUtil.round(Audio.getSampleRate() * d.duration),
                    phase: (typeof d.phase !== 'undefined') ? d.phase : 0
                }]);
            }

            channelTx.addToQueue(dataParsed);
        };

        PL.prototype.rx = function (rxHandler) {
            this.$$rxExternalHandler.callback = (
                (typeof rxHandler === 'function') ?
                rxHandler :
                null
            );
        };

        PL.prototype.getSampleRate = function () {
            return Audio.getSampleRate();
        };

        PL.prototype.destroy = function () {
            var i, j, promiseResolve, promise, destroyAsyncCount;

            destroyAsyncCount = 0;
            promise = new Promise(function (resolve) {
                promiseResolve = resolve;
            });

            this.setRxInput(null);

            // rx
            if (this.$$rxAnalyserChart) {
                destroyAsyncCount++;
                this.$$rxAnalyserChart
                    .destroy()
                    .then(function () {
                        destroyAsyncCount--;
                        if (destroyAsyncCount === 0) {
                            promiseResolve();
                        }
                    })
                ;
                this.$$rxAnalyserChart = null;
            }
            this.$$rxAnalyser.disconnect(this.$$channelReceiveManager.getInputNode());
            if (this.$$rxConstellationDiagram) {
                for (i = 0; i < this.$$rxConstellationDiagram.length; i++) {
                    for (j = 0; j < this.$$rxConstellationDiagram[i].constellationDiagram.length; j++) {
                        destroyAsyncCount++;
                        this.$$rxConstellationDiagram[i].constellationDiagram[j]
                            .destroy()
                            .then(function () {
                                destroyAsyncCount--;
                                if (destroyAsyncCount === 0) {
                                    promiseResolve();
                                }
                            })
                        ;
                    }
                }
            }
            this.$$channelReceiveManager.destroy();
            this.$$channelReceiveManager = null;

            // tx
            this.outputTxDisable();
            this.outputRecordedAudioDisable();
            this.outputMicrophoneDisable();
            this.$$channelTransmitManager.destroy();
            this.$$channelTransmitManager = null;

            this.$$rxHandler.destroy();

            return promise;
        };

        PL.prototype.getOutputTxState = function () {
            return this.$$outputTx;
        };

        PL.prototype.getOutputMicrophoneState = function () {
            return this.$$outputMicrophone;
        };

        PL.prototype.getOutputRecordedAudioState = function () {
            return this.$$outputRecordedAudio;
        };

        PL.prototype.outputTxEnable = function () {
            if (!this.$$outputTx) {
                this.$$channelTransmitManager.getOutputNode().connect(Audio.getDestination());
            }
            this.$$outputTx = true;
        };

        PL.prototype.outputTxDisable = function () {
            if (this.$$outputTx) {
                this.$$channelTransmitManager.getOutputNode().disconnect(Audio.getDestination());
            }
            this.$$outputTx = false;
        };

        PL.prototype.outputMicrophoneEnable = function () {
            if (!this.$$outputMicrophone) {
                Audio.getMicrophoneNode().connect(Audio.getDestination());
            }
            this.$$outputMicrophone = true;
        };

        PL.prototype.outputMicrophoneDisable = function () {
            if (this.$$outputMicrophone) {
                Audio.getMicrophoneNode().disconnect(Audio.getDestination());
            }
            this.$$outputMicrophone = false;
        };

        PL.prototype.outputRecordedAudioEnable = function () {
            if (!this.$$outputRecordedAudio) {
                Audio.getRecordedAudioNode().connect(Audio.getDestination());
            }
            this.$$outputRecordedAudio = true;
        };

        PL.prototype.outputRecordedAudioDisable = function () {
            if (this.$$outputRecordedAudio) {
                Audio.getRecordedAudioNode().disconnect(Audio.getDestination());
            }
            this.$$outputRecordedAudio = false;
        };

        PL.prototype.getRxCpuLoadData = function () {
            return this.$$channelReceiveManager.getCpuLoadData();
        };

        PL.prototype.getTxCpuLoadData = function () {
            return this.$$channelTransmitManager.getCpuLoadData();
        };

        PL.prototype.getRxFrequency = function (channelIndex, ofdmIndex) {
            return (
                this.$$channelReceiveManager
                    .getChannel(channelIndex)
                    .getFrequency(ofdmIndex)
            );
        };

        PL.prototype.getTxFrequency = function (channelIndex, ofdmIndex) {
            return (
                this.$$channelTransmitManager
                .getChannel(channelIndex)
                .getFrequency(ofdmIndex)
            );
        };

        PL.prototype.setRxFrequency = function (channelIndex, ofdmIndex, frequency) {
            this.$$channelReceiveManager
                .getChannel(channelIndex)
                .setFrequency(ofdmIndex, frequency)
            ;
        };

        PL.prototype.setTxFrequency = function (channelIndex, ofdmIndex, frequency) {
            this.$$channelTransmitManager
                .getChannel(channelIndex)
                .setFrequency(ofdmIndex, frequency)
            ;
        };


        PL.prototype.getRxPhaseCorrection = function (channelIndex, ofdmIndex) {
            return (
                this.$$channelReceiveManager
                    .getChannel(channelIndex)
                    .getRxPhaseCorrection(ofdmIndex)
            );
        };

        PL.prototype.getTxPhaseCorrection = function (channelIndex, ofdmIndex) {
            return (
                this.$$channelTransmitManager
                .getChannel(channelIndex)
                .getTxPhaseCorrection(ofdmIndex)
            );
        };

        PL.prototype.setRxPhaseCorrection = function (channelIndex, ofdmIndex, phaseCorrection) {
            this.$$channelReceiveManager
                .getChannel(channelIndex)
                .setRxPhaseCorrection(ofdmIndex, phaseCorrection)
            ;
        };

        PL.prototype.setTxPhaseCorrection = function (channelIndex, ofdmIndex, phaseCorrection) {
            this.$$channelTransmitManager
                .getChannel(channelIndex)
                .setTxPhaseCorrection(ofdmIndex, phaseCorrection)
            ;
        };

        PL.prototype.getTxChannelSize = function () {
            return this.$$channelTransmitManager.getChannelSize();
        };

        PL.prototype.getRxChannelSize = function () {
            return this.$$channelReceiveManager.getChannelSize();
        };

        PL.prototype.getTxChannelOfdmSize = function (channelIndex) {
            return this.$$channelTransmitManager.getChannel(channelIndex).getOfdmSize();
        };

        PL.prototype.getRxChannelOfdmSize = function (channelIndex) {
            return this.$$channelReceiveManager.getChannel(channelIndex).getOfdmSize();
        };

        return PL;
    }

})();
