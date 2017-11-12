/*
The MIT License (MIT)

Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    AudioNetwork = {},                                        // namespace visible to the global JavaScript scope
    AudioNetworkBootConfig = AudioNetworkBootConfig || {};    // injects boot config

AudioNetwork.version = '1.1.0';

// conditions from: http://stackoverflow.com/a/33697246
AudioNetwork.isNode = typeof module !== 'undefined' && module.exports ? true : false;
AudioNetwork.isWebWorker = !AudioNetwork.isNode && typeof WorkerGlobalScope !== 'undefined' && typeof importScripts == 'function' && navigator instanceof WorkerNavigator;
AudioNetwork.isBrowser = !AudioNetwork.isNode && !AudioNetwork.isWebWorker && typeof navigator !== 'undefined' && typeof document !== 'undefined';

/*
console.log(AudioNetwork.isNode);
console.log(AudioNetwork.isWebWorker);
console.log(AudioNetwork.isBrowser);
*/

AudioNetwork.MULTICORE_STATE = {
    DISABLED: 'DISABLED',
    ENABLED_USE_PROD_SCRIPT: 'ENABLED_USE_PROD_SCRIPT',
    ENABLED_USE_DEV_SCRIPT: 'ENABLED_USE_DEV_SCRIPT'
};

AudioNetwork.bootConfig = {
    devScriptBaseUrl: typeof AudioNetworkBootConfig.devScriptBaseUrl === 'string'
        ? AudioNetworkBootConfig.devScriptBaseUrl
        : (AudioNetwork.isBrowser ? window.location.origin + '/src/' : ''),
    prodScriptBaseUrl: typeof AudioNetworkBootConfig.prodScriptBaseUrl === 'string'
        ? AudioNetworkBootConfig.prodScriptBaseUrl
        : (AudioNetwork.isBrowser ? window.location.origin + '/build/' : ''),
    prodScriptName: typeof AudioNetworkBootConfig.prodScriptName === 'string'
        ? AudioNetworkBootConfig.prodScriptName
        : 'audio-network-v' + AudioNetwork.version + '.min.js',
    devScriptLoad: typeof AudioNetworkBootConfig.devScriptLoad !== 'undefined'
        ? !!AudioNetworkBootConfig.devScriptLoad
        : false,
    createAlias: typeof AudioNetworkBootConfig.createAlias !== 'undefined'
        ? !!AudioNetworkBootConfig.createAlias
        : (AudioNetwork.isBrowser ? true : false),
    multicoreState: Object.keys(AudioNetwork.MULTICORE_STATE).indexOf(AudioNetworkBootConfig.multicoreState) !== -1
        ? AudioNetworkBootConfig.multicoreState
        : AudioNetwork.MULTICORE_STATE.DISABLED
};

AudioNetwork.Injector = (function () {
    var Injector;

    Injector = function () {
        this.$$injectRepository = {};
    };

    Injector.RESOLVE_RECURSION_LIMIT = 20;
    Injector.RESOLVE_RECURSION_LIMIT_EXCEED_EXCEPTION = 'Injector - resolve recursion limit exceed';
    Injector.MULTIPLE_REGISTER_EXCEPTION = 'Injector - multiple register calls for the same name';
    Injector.UNABLE_TO_FIND_ITEM_EXCEPTION = 'Injector - unable to find factory/service for given name: ';
    Injector.TYPE = {
        SERVICE: 'SERVICE',
        FACTORY: 'FACTORY'
    };

    Injector.$$resolveRecursionCounter = 0;

    Injector.prototype.$$register = function (name, item, type) {
        if (typeof this.$$injectRepository[name] === 'undefined') {
            this.$$injectRepository[name] = {
                type: type,
                item: item,
                resolveCache: null
            };
        } else {
            throw Injector.MULTIPLE_REGISTER_EXCEPTION;
        }
    };

    Injector.prototype.registerService = function (name, service) {
        this.$$register(name, service, Injector.TYPE.SERVICE);
    };

    Injector.prototype.registerFactory = function (name, factory) {
        this.$$register(name, factory, Injector.TYPE.FACTORY);
    };

    Injector.prototype.resolve = function (name) {
        var i, findResult, injectList = [];

        findResult = this.$$find(name);
        if (findResult.resolveCache) {
            return findResult.resolveCache;
        }

        this.$$resolveRecursionInc();
        for (i = 0; i < findResult.item.$inject.length; i++) {
            injectList.push(
              this.resolve(findResult.item.$inject[i])
            );
        }
        switch (findResult.type) {
            case Injector.TYPE.SERVICE:
                findResult.resolveCache = this.$$injectDependenciesAndInstantiate(findResult, injectList);
                break;
            case Injector.TYPE.FACTORY:
                findResult.resolveCache = this.$$injectDependencies(findResult, injectList);
                break;
        }
        this.$$resolveRecursionDec();

        return findResult.resolveCache;
    };

    Injector.prototype.$$resolveRecursionInc = function () {
        Injector.$$resolveRecursionCounter++;
        if (Injector.$$resolveRecursionCounter >= Injector.RESOLVE_RECURSION_LIMIT) {
            throw Injector.RESOLVE_RECURSION_LIMIT_EXCEED_EXCEPTION;
        }
    };

    Injector.prototype.$$resolveRecursionDec = function () {
        Injector.$$resolveRecursionCounter--;
    };

    Injector.prototype.$$injectDependenciesAndInstantiate = function (findResult, injectList) {
        var
            f = findResult,
            i = injectList,
            r
        ;

        switch (injectList.length) {
            case 0: r = new f.item(); break;
            case 1: r = new f.item(i[0]); break;
            case 2: r = new f.item(i[0], i[1]); break;
            case 3: r = new f.item(i[0], i[1], i[2]); break;
            case 4: r = new f.item(i[0], i[1], i[2], i[3]); break;
            case 5: r = new f.item(i[0], i[1], i[2], i[3], i[4]); break;
            case 6: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5]); break;
            case 7: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6]); break;
            case 8: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7]); break;
            case 9: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8]); break;
            case 10: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9]); break;
            case 11: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10]); break;
            case 12: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10], i[11]); break;
        }

        return r;
    };

    Injector.prototype.$$injectDependencies = function (findResult, injectList) {
        var
            f = findResult,
            i = injectList,
            r
        ;

        switch (injectList.length) {
            case 0: r = f.item(); break;
            case 1: r = f.item(i[0]); break;
            case 2: r = f.item(i[0], i[1]); break;
            case 3: r = f.item(i[0], i[1], i[2]); break;
            case 4: r = f.item(i[0], i[1], i[2], i[3]); break;
            case 5: r = f.item(i[0], i[1], i[2], i[3], i[4]); break;
            case 6: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5]); break;
            case 7: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6]); break;
            case 8: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7]); break;
            case 9: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8]); break;
            case 10: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9]); break;
            case 11: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10]); break;
            case 12: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10], i[11]); break;
        }

        return r;
    };

    Injector.prototype.$$find = function (name) {
        var key;

        for (key in this.$$injectRepository) {
            if (this.$$injectRepository.hasOwnProperty(key) && key === name) {
                return this.$$injectRepository[key];
            }
        }
        throw Injector.UNABLE_TO_FIND_ITEM_EXCEPTION + name;
    };

    return new Injector(); // instantiate service
})();

AudioNetwork.DynamicScriptLoader = (function () {
    var DynamicScriptLoader;

    DynamicScriptLoader = function () {
    };

    DynamicScriptLoader.prototype.loadList = function (urlList, startingIndex) {
        var i;

        if (typeof startingIndex === 'undefined') {
            startingIndex = 0;
        }

        for (i = startingIndex; i < urlList.length; i++) {
            this.loadOne(urlList[i]);
        }
    };

    DynamicScriptLoader.prototype.loadOne = function (url) {
        /*
        var
            anRoot = document.getElementById('an-root'),
            scriptTag = document.createElement('script'),
            whereToAppend = anRoot ? anRoot : document.body;

        scriptTag.src = AudioNetwork.bootConfig.devScriptBaseUrl + url;
        whereToAppend.appendChild(scriptTag);
        */
        // block page loading - this is the best approach so far... :)
        document.write('<script src="' + AudioNetwork.bootConfig.devScriptBaseUrl + url + '"></script>')
    };

    return new DynamicScriptLoader(); // instantiate service
})();

AudioNetwork.devScriptList = [
    'audio-network-boot.js',
    '-deprecated-probably/common/math-util/math-util.service.js',
    '-deprecated-probably/common/simple-promise/simple-promise-builder.service.js',
    '-deprecated-probably/common/simple-promise/simple-promise.factory.js',
    '-deprecated-probably/common/stopwatch/stopwatch-builder.service.js',
    '-deprecated-probably/common/stopwatch/stopwatch.factory.js',
    '-deprecated-probably/common/window-function/window-function.service.js',
    '-deprecated-probably/physical-layer-core/receive-multicore-worker/receive-multicore-worker-thread.service.js',
    '-deprecated-probably/physical-layer-core/receive-multicore-worker/receive-multicore-worker.factory.js',
    '-deprecated-probably/physical-layer-core/receive-worker/receive-worker.factory.js',
    '-deprecated/audio/active-audio-context/active-audio-context.service.js',
    '-deprecated/audio/simple-audio-context/simple-audio-context-builder.service.js',
    '-deprecated/audio/simple-audio-context/simple-audio-context.factory.js',
    '-deprecated/common/abstract-value-collector/abstract-value-collector.factory.js',
    '-deprecated/common/average-value-collector/average-value-collector-builder.service.js',
    '-deprecated/common/average-value-collector/average-value-collector.factory.js',
    '-deprecated/common/carrier-generate/carrier-generate-builder.service.js',
    '-deprecated/common/carrier-generate/carrier-generate.factory.js',
    '-deprecated/common/carrier-recovery/carrier-recovery-builder.service.js',
    '-deprecated/common/carrier-recovery/carrier-recovery.factory.js',
    '-deprecated/common/complex/complex-builder.service.js',
    '-deprecated/common/complex/complex.factory.js',
    '-deprecated/common/queue/queue-builder.service.js',
    '-deprecated/common/queue/queue.factory.js',
    '-deprecated/common/util/util.service.js',
    '-deprecated/physical-layer-adapter/guard-power-collector/guard-power-collector-builder.service.js',
    '-deprecated/physical-layer-adapter/guard-power-collector/guard-power-collector.factory.js',
    '-deprecated/physical-layer-adapter/phase-offset-collector/phase-offset-collector-builder.service.js',
    '-deprecated/physical-layer-adapter/phase-offset-collector/phase-offset-collector.factory.js',
    '-deprecated/physical-layer-adapter/receive-adapter-state.service.js',
    '-deprecated/physical-layer-adapter/receive-adapter.factory.js',
    '-deprecated/physical-layer-adapter/rx-state-machine-manager/rx-state-machine-manager-builder.service.js',
    '-deprecated/physical-layer-adapter/rx-state-machine-manager/rx-state-machine-manager.factory.js',
    '-deprecated/physical-layer-adapter/rx-state-machine/rx-state-machine-builder.service.js',
    '-deprecated/physical-layer-adapter/rx-state-machine/rx-state-machine.factory.js',
    '-deprecated/physical-layer-adapter/signal-power-collector/signal-power-collector-builder.service.js',
    '-deprecated/physical-layer-adapter/signal-power-collector/signal-power-collector.factory.js',
    '-deprecated/physical-layer-adapter/transmit-adapter.factory.js',
    '-deprecated/physical-layer/abstract-channel-manager/abstract-channel-manager.factory.js',
    '-deprecated/physical-layer/channel-receive-manager/channel-receive-manager-builder.service.js',
    '-deprecated/physical-layer/channel-receive-manager/channel-receive-manager.factory.js',
    '-deprecated/physical-layer/channel-receive/channel-receive-builder.service.js',
    '-deprecated/physical-layer/channel-receive/channel-receive.factory.js',
    '-deprecated/physical-layer/channel-transmit-manager/channel-transmit-manager-builder.service.js',
    '-deprecated/physical-layer/channel-transmit-manager/channel-transmit-manager.factory.js',
    '-deprecated/physical-layer/channel-transmit/channel-transmit-builder.service.js',
    '-deprecated/physical-layer/channel-transmit/channel-transmit.factory.js',
    '-deprecated/physical-layer/configuration-parser.service.js',
    '-deprecated/physical-layer/default-config.service.js',
    '-deprecated/physical-layer/physical-layer.factory.js',
    '-deprecated/physical-layer/rx-handler/rx-handler-builder.service.js',
    '-deprecated/physical-layer/rx-handler/rx-handler.factory.js',
    '-deprecated/physical-layer/rx-input.service.js',
    'visualizer/abstract-2d-visualizer/abstract-2d-visualizer.factory.js',
    'visualizer/abstract-visualizer/abstract-visualizer.factory.js',
    'visualizer/analyser-chart/analyser-chart-builder.service.js',
    'visualizer/analyser-chart/analyser-chart-template-axis-x.service.js',
    'visualizer/analyser-chart/analyser-chart-template-main.service.js',
    'visualizer/analyser-chart/analyser-chart.factory.js',
    'visualizer/complex-plane-chart/complex-plane-chart-builder.service.js',
    'visualizer/complex-plane-chart/complex-plane-chart-template-main.service.js',
    'visualizer/complex-plane-chart/complex-plane-chart.factory.js',
    'visualizer/constellation-diagram/constellation-diagram-builder.service.js',
    'visualizer/constellation-diagram/constellation-diagram-template-main.service.js',
    'visualizer/constellation-diagram/constellation-diagram.factory.js',
    'visualizer/frequency-domain-chart/frequency-domain-chart-builder.service.js',
    'visualizer/frequency-domain-chart/frequency-domain-chart-template-main.service.js',
    'visualizer/frequency-domain-chart/frequency-domain-chart.factory.js',
    'visualizer/power-chart/power-chart-builder.service.js',
    'visualizer/power-chart/power-chart-template-main.service.js',
    'visualizer/power-chart/power-chart.factory.js',
    'visualizer/sample-chart/sample-chart-builder.service.js',
    'visualizer/sample-chart/sample-chart-template-main.service.js',
    'visualizer/sample-chart/sample-chart.factory.js',
    'audio-network-end.js'
];

if (AudioNetwork.isBrowser && AudioNetwork.bootConfig.devScriptLoad) {
    // start from index 1 because audio-network-boot.js was already loaded
    AudioNetwork.DynamicScriptLoader.loadList(AudioNetwork.devScriptList, 1);
}

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ConfigurationParser', _ConfigurationParser);

    _ConfigurationParser.$inject = [
        'Common.MathUtil',
        'Common.Util',
        'PhysicalLayer.DefaultConfig'
    ];

    function _ConfigurationParser(
        MathUtil,
        Util,
        DefaultConfig
    ) {

        function parseChannel(configuration, txRx) {
            var i, txChannel, result, channelDataExists, channelListSize;

            result = [];
            txChannel = Util.accessor(configuration, txRx + '.channel');
            channelDataExists = txChannel ? true : false;
            txChannel = txChannel ? txChannel : [];
            channelListSize = txChannel.length;

            for (i = 0; i < (channelDataExists ? channelListSize : 2); i++) {
                result.push({
                    baseFrequency: (
                        Util.accessor(txChannel[i], 'baseFrequency') ||
                        (i % 2 === 0 ? DefaultConfig.CHANNEL_1_FREQUENCY : DefaultConfig.CHANNEL_2_FREQUENCY)
                    ),
                    ofdmSize: Util.accessor(txChannel[i], 'ofdmSize') || DefaultConfig.OFDM_SIZE,
                    ofdmFrequencySpacing: (
                        Util.accessor(txChannel[i], 'ofdmFrequencySpacing') || DefaultConfig.OFDM_FREQUENCY_SPACING
                    )
                });
            }

            return result;
        }

        function parse(configuration) {
            var
                c = configuration,
                a = Util.accessor,
                finalConfiguration
            ;

            finalConfiguration = {
                tx: {
                    bufferSize: c && c.tx && (typeof c.tx.bufferSize !== 'undefined') ? c.tx.bufferSize : 0,
                    channel: parseChannel(c, 'tx')
                },
                rx: {
                    bufferSize: c && c.rx && (typeof c.rx.bufferSize !== 'undefined') ? c.rx.bufferSize : 0,
                    channel: parseChannel(c, 'rx'),
                    input: a(c, 'rx.input') || DefaultConfig.RX_INPUT,
                    notificationPerSecond: a(c, 'rx.notificationPerSecond') || DefaultConfig.RX_NOTIFICATION_PER_SECOND,
                    dftWindowTime: a(c, 'rx.dftWindowTime') || DefaultConfig.RX_DFT_WINDOW_TIME,
                    spectrum: {
                        elementId: a(c, 'rx.spectrum.elementId') || null,
                        color: {
                            axis: a(c, 'rx.spectrum.color.axis') || '#444',
                            data: a(c, 'rx.spectrum.color.data') || '#888888'
                        },
                        fftSize: a(c, 'rx.spectrum.fftSize') || DefaultConfig.RX_SPECTRUM_FFT_SIZE,
                        height: a(c, 'rx.spectrum.height') || 200
                    },
                    constellationDiagram: {
                        elementId: (
                            a(c, 'rx.constellationDiagram.elementId') || null
                        ),
                        color: {
                            historyPoint: {
                                red: {
                                    newest: a(c, 'rx.constellationDiagram.color.historyPoint.red.newest') || 0,
                                    tailNewest: a(c, 'rx.constellationDiagram.color.historyPoint.red.tailNewest') || 100,
                                    tailOldest: a(c, 'rx.constellationDiagram.color.historyPoint.red.tailOldest') || 180
                                },
                                green: {
                                    newest: a(c, 'rx.constellationDiagram.color.historyPoint.green.newest') || 0,
                                    tailNewest: a(c, 'rx.constellationDiagram.color.historyPoint.green.tailNewest') || 100,
                                    tailOldest: a(c, 'rx.constellationDiagram.color.historyPoint.green.tailOldest') || 200
                                },
                                blue: {
                                    newest: a(c, 'rx.constellationDiagram.color.historyPoint.blue.newest') || 0,
                                    tailNewest: a(c, 'rx.constellationDiagram.color.historyPoint.blue.tailNewest') || 100,
                                    tailOldest: a(c, 'rx.constellationDiagram.color.historyPoint.blue.tailOldest') || 150
                                }
                            },
                            axis: a(c, 'rx.constellationDiagram.color.axis') || 'green'
                        },
                        historyPointSize: MathUtil.round(a(c, 'rx.constellationDiagram.historyPointSize') || DefaultConfig.RX_HISTORY_POINT_SIZE),
                        width: a(c, 'rx.constellationDiagram.width') || 200,
                        height: a(c, 'rx.constellationDiagram.height') || 200
                    }
                }
            };

            return finalConfiguration;
        }

        return {
            parse: parse
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.DefaultConfig', _DefaultConfig);

    _DefaultConfig.$inject = [
        'PhysicalLayer.RxInput',
        'Common.MathUtil'
    ];

    function _DefaultConfig(
        RxInput,
        MathUtil
    ) {
        var
            baud = 4,
            baudMultiplicativeInverse = 1 / baud,
            factorSymbol = 0.26,
            factorGuard = 0.74,
            factorInterpacketGap = 5,
            symbolDuration = baudMultiplicativeInverse * factorSymbol,
            rxDftWindowTime = symbolDuration,
            guardInterval = baudMultiplicativeInverse * factorGuard,
            interpacketGap = guardInterval * factorInterpacketGap,
            ofdmFrequencySpacingPositiveInteger = 2,
            ofdmFrequencySpacing = ofdmFrequencySpacingPositiveInteger / symbolDuration,
            symbolFrequency = 1 / symbolDuration,
            symbolFrequencyFactor = 2.5,
            rxNotificationPerSecond = MathUtil.round(symbolFrequencyFactor * symbolFrequency),
            rxHistoryPointSize = rxNotificationPerSecond
        ;

        /*
            OFDM Frequency Spacing explanation [Wikipedia]:
                "The orthogonality requires that the sub-carrier spacing is k/TU Hertz, where TU seconds
                is the useful symbol duration (the receiver side window size), and k is a positive integer,
                typically equal to 1"

            Channel frequencies explanation [Wikipedia]:
                "In the Bell 103 system, the originating modem sends 0s by playing a 1,070 Hz tone,
                and 1s at 1,270 Hz, with the answering modem transmitting its 0s on 2,025 Hz and
                1s on 2,225 Hz. These frequencies were chosen carefully; they are in the range that
                suffers minimum distortion on the phone system and are not harmonics of each other."
        */

        return {
            CONSTELLATION_DIAGRAM_DECIBEL_LIMIT: -40,
            MINIMUM_POWER_DECIBEL: -99,
            FAKE_NOISE_MAX_AMPLITUDE: 0.001,
            CHANNEL_1_FREQUENCY: 1070,
            CHANNEL_2_FREQUENCY: 2025,
            OFDM_SIZE: 1,
            OFDM_FREQUENCY_SPACING_POSITIVE_INTEGER: ofdmFrequencySpacingPositiveInteger,
            OFDM_FREQUENCY_SPACING: ofdmFrequencySpacing,
            SYMBOL_FREQUENCY: symbolFrequency,
            SYMBOL_FREQUENCY_FACTOR: symbolFrequencyFactor,
            RX_INPUT: RxInput.MICROPHONE,
            RX_NOTIFICATION_PER_SECOND: rxNotificationPerSecond,
            RX_HISTORY_POINT_SIZE: rxHistoryPointSize,
            RX_DFT_WINDOW_TIME: rxDftWindowTime,
            RX_SPECTRUM_FFT_SIZE: 1024,
            BAUD: baud,
            BAUD_MULTIPLICATIVE_INVERSE: baudMultiplicativeInverse,
            FACTOR_SYMBOL: factorSymbol,
            FACTOR_GUARD: factorGuard,
            SYNC_DURATION: 2.0,
            SYMBOL_DURATION: symbolDuration,
            GUARD_INTERVAL: guardInterval,
            FACTOR_INTERPACKET_GAP: factorInterpacketGap,
            INTERPACKET_GAP: interpacketGap,
            PSK_SIZE: 2,
            SYNC_PREAMBLE: true
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.PhysicalLayer', _PhysicalLayer);
    
    _PhysicalLayer.$inject = [
        'Common.QueueBuilder',
        'Common.MathUtil',
        'PhysicalLayer.DefaultConfig',
        'PhysicalLayer.ConfigurationParser',
        'PhysicalLayer.RxInput',
        'PhysicalLayer.RxHandlerBuilder',
        'PhysicalLayer.ChannelTransmitManagerBuilder',
        'PhysicalLayer.ChannelReceiveManagerBuilder',
        'Visualizer.ConstellationDiagramBuilder',
        'Visualizer.AnalyserChartBuilder',
        'Audio.ActiveAudioContext',
        'Common.SimplePromiseBuilder'
    ];

    function _PhysicalLayer(
        QueueBuilder,
        MathUtil,
        DefaultConfig,
        ConfigurationParser,
        RxInput,
        RxHandlerBuilder,
        ChannelTransmitManagerBuilder,
        ChannelReceiveManagerBuilder,
        ConstellationDiagramBuilder,
        AnalyserChartBuilder,
        ActiveAudioContext,
        SimplePromiseBuilder
    ) {
        var PhysicalLayer;

        PhysicalLayer = function (configuration) {
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

        PhysicalLayer.prototype.$$initTx = function () {
            this.$$channelTransmitManager = ChannelTransmitManagerBuilder.build(
                this.$$configuration.tx.channel,
                this.$$configuration.tx.bufferSize
            );

            this.outputTxEnable();
            this.outputMicrophoneDisable();
            this.outputRecordedAudioDisable();
        };

        PhysicalLayer.prototype.$$initConstellationDiagram = function (channelIndex, channel) {
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
                    QueueBuilder.build(this.$$configuration.rx.constellationDiagram.historyPointSize)
                );
                constellationDiagram.push(
                    ConstellationDiagramBuilder.build(
                        document.getElementById(elementId),
                        this.$$configuration.rx.constellationDiagram.width,
                        this.$$configuration.rx.constellationDiagram.height,
                        queue[queue.length - 1],
                        DefaultConfig.CONSTELLATION_DIAGRAM_DECIBEL_LIMIT,
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

        PhysicalLayer.prototype.$$initRx = function () {
            var
                dftWindowSize = MathUtil.round(ActiveAudioContext.getSampleRate() * this.$$configuration.rx.dftWindowTime),
                notifyInterval = MathUtil.round(ActiveAudioContext.getSampleRate() / this.$$configuration.rx.notificationPerSecond),
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

            this.$$rxAnalyser = ActiveAudioContext.createAnalyser();
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

        PhysicalLayer.prototype.$$getTxInputNode = function (input) {
            var node = null;

            switch (input) {
                case RxInput.MICROPHONE:
                    node = ActiveAudioContext.getMicrophoneNode();
                    break;
                case RxInput.LOOPBACK:
                    node = this.$$channelTransmitManager.getOutputNode();
                    break;
                case RxInput.RECORDED_AUDIO:
                    node = ActiveAudioContext.getRecordedAudioNode();
                    break;
            }

            return node;
        };

        PhysicalLayer.prototype.getRxInput = function () {
            return this.$$currentInput;
        };

        PhysicalLayer.prototype.setRxInput = function (input) {
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

        PhysicalLayer.prototype.getTxBufferSize = function () {
            return this.$$channelTransmitManager.getBufferSize();
        };

        PhysicalLayer.prototype.getRxBufferSize = function () {
            return this.$$channelReceiveManager.getBufferSize();
        };

        PhysicalLayer.prototype.loadRecordedAudio = function (url) {
            return ActiveAudioContext.loadRecordedAudio(url);
        };

        PhysicalLayer.prototype.tx = function (channelIndex, data) {
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

                dataParsed.push({
                    amplitude: (typeof d.amplitude !== 'undefined') ? d.amplitude : 1,
                    duration: MathUtil.round(ActiveAudioContext.getSampleRate() * d.duration),
                    phase: (typeof d.phase !== 'undefined') ? d.phase : 0
                });
            }

            channelTx.addToQueue(dataParsed);
        };

        PhysicalLayer.prototype.rx = function (rxHandler) {
            this.$$rxExternalHandler.callback = (typeof rxHandler === 'function') ? rxHandler : null;
        };

        PhysicalLayer.prototype.getSampleRate = function () {
            return ActiveAudioContext.getSampleRate();
        };

        PhysicalLayer.prototype.destroy = function () {
            var i, j, promiseList = [];

            this.setRxInput(null);

            // rx
            if (this.$$rxAnalyserChart) {
                promiseList.push(this.$$rxAnalyserChart.destroy());
                this.$$rxAnalyserChart = null;
            }
            this.$$rxAnalyser.disconnect(this.$$channelReceiveManager.getInputNode());
            if (this.$$rxConstellationDiagram) {
                for (i = 0; i < this.$$rxConstellationDiagram.length; i++) {
                    for (j = 0; j < this.$$rxConstellationDiagram[i].constellationDiagram.length; j++) {
                        promiseList.push(
                            this.$$rxConstellationDiagram[i].constellationDiagram[j].destroy()
                        );
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

            return SimplePromiseBuilder.buildFromList(promiseList);
        };

        PhysicalLayer.prototype.getOutputTxState = function () {
            return this.$$outputTx;
        };

        PhysicalLayer.prototype.getOutputMicrophoneState = function () {
            return this.$$outputMicrophone;
        };

        PhysicalLayer.prototype.getOutputRecordedAudioState = function () {
            return this.$$outputRecordedAudio;
        };

        PhysicalLayer.prototype.outputTxEnable = function () {
            if (!this.$$outputTx) {
                this.$$channelTransmitManager.getOutputNode().connect(ActiveAudioContext.getDestination());
            }
            this.$$outputTx = true;
        };

        PhysicalLayer.prototype.outputTxDisable = function () {
            if (this.$$outputTx) {
                this.$$channelTransmitManager.getOutputNode().disconnect(ActiveAudioContext.getDestination());
            }
            this.$$outputTx = false;
        };

        PhysicalLayer.prototype.outputMicrophoneEnable = function () {
            if (!this.$$outputMicrophone) {
                ActiveAudioContext.getMicrophoneNode().connect(ActiveAudioContext.getDestination());
            }
            this.$$outputMicrophone = true;
        };

        PhysicalLayer.prototype.outputMicrophoneDisable = function () {
            if (this.$$outputMicrophone) {
                ActiveAudioContext.getMicrophoneNode().disconnect(ActiveAudioContext.getDestination());
            }
            this.$$outputMicrophone = false;
        };

        PhysicalLayer.prototype.outputRecordedAudioEnable = function () {
            if (!this.$$outputRecordedAudio) {
                ActiveAudioContext.getRecordedAudioNode().connect(ActiveAudioContext.getDestination());
            }
            this.$$outputRecordedAudio = true;
        };

        PhysicalLayer.prototype.outputRecordedAudioDisable = function () {
            if (this.$$outputRecordedAudio) {
                ActiveAudioContext.getRecordedAudioNode().disconnect(ActiveAudioContext.getDestination());
            }
            this.$$outputRecordedAudio = false;
        };

        PhysicalLayer.prototype.getRxCpuLoadData = function () {
            return this.$$channelReceiveManager.getCpuLoadData();
        };

        PhysicalLayer.prototype.getTxCpuLoadData = function () {
            return this.$$channelTransmitManager.getCpuLoadData();
        };

        PhysicalLayer.prototype.getRxFrequency = function (channelIndex, ofdmIndex) {
            return (
                this.$$channelReceiveManager
                    .getChannel(channelIndex)
                    .getFrequency(ofdmIndex)
            );
        };

        PhysicalLayer.prototype.getTxFrequency = function (channelIndex, ofdmIndex) {
            return (
                this.$$channelTransmitManager
                .getChannel(channelIndex)
                .getFrequency(ofdmIndex)
            );
        };

        PhysicalLayer.prototype.setRxFrequency = function (channelIndex, ofdmIndex, frequency) {
            this.$$channelReceiveManager
                .getChannel(channelIndex)
                .setFrequency(ofdmIndex, frequency)
            ;
        };

        PhysicalLayer.prototype.setTxFrequency = function (channelIndex, ofdmIndex, frequency) {
            this.$$channelTransmitManager
                .getChannel(channelIndex)
                .setFrequency(ofdmIndex, frequency)
            ;
        };


        PhysicalLayer.prototype.getRxPhaseCorrection = function (channelIndex, ofdmIndex) {
            return (
                this.$$channelReceiveManager
                    .getChannel(channelIndex)
                    .getRxPhaseCorrection(ofdmIndex)
            );
        };

        PhysicalLayer.prototype.getTxPhaseCorrection = function (channelIndex, ofdmIndex) {
            return (
                this.$$channelTransmitManager
                .getChannel(channelIndex)
                .getTxPhaseCorrection(ofdmIndex)
            );
        };

        PhysicalLayer.prototype.setRxPhaseCorrection = function (channelIndex, ofdmIndex, phaseCorrection) {
            this.$$channelReceiveManager
                .getChannel(channelIndex)
                .setRxPhaseCorrection(ofdmIndex, phaseCorrection)
            ;
        };

        PhysicalLayer.prototype.setTxPhaseCorrection = function (channelIndex, ofdmIndex, phaseCorrection) {
            this.$$channelTransmitManager
                .getChannel(channelIndex)
                .setTxPhaseCorrection(ofdmIndex, phaseCorrection)
            ;
        };

        PhysicalLayer.prototype.getTxChannelSize = function () {
            return this.$$channelTransmitManager.getChannelSize();
        };

        PhysicalLayer.prototype.getRxChannelSize = function () {
            return this.$$channelReceiveManager.getChannelSize();
        };

        PhysicalLayer.prototype.getTxChannelOfdmSize = function (channelIndex) {
            return this.$$channelTransmitManager.getChannel(channelIndex).getOfdmSize();
        };

        PhysicalLayer.prototype.getRxChannelOfdmSize = function (channelIndex) {
            return this.$$channelReceiveManager.getChannel(channelIndex).getOfdmSize();
        };

        return PhysicalLayer;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.RxInput', _RxInput);

    _RxInput.$inject = [];

    function _RxInput() {
        return {
            MICROPHONE: 'MICROPHONE',
            LOOPBACK: 'LOOPBACK',
            RECORDED_AUDIO: 'RECORDED_AUDIO'
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.ReceiveAdapterState', _ReceiveAdapterState);

    _ReceiveAdapterState.$inject = [];

    function _ReceiveAdapterState() {
        return {
            NO_INPUT: 'NO_INPUT',
            IDLE_INIT: 'IDLE_INIT',
            FIRST_SYNC_WAIT: 'FIRST_SYNC_WAIT',
            FIRST_SYNC: 'FIRST_SYNC',
            FATAL_ERROR: 'FATAL_ERROR',
            IDLE: 'IDLE',
            SYMBOL: 'SYMBOL',
            SYNC: 'SYNC',
            GUARD: 'GUARD',
            ERROR: 'ERROR'
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerAdapter.ReceiveAdapter', _ReceiveAdapter);

    _ReceiveAdapter.$inject = [
        'PhysicalLayer.DefaultConfig',
        'PhysicalLayerAdapter.RxStateMachineManagerBuilder',
        'Common.MathUtil'
    ];

    function _ReceiveAdapter(
        DefaultConfig,
        RxStateMachineManagerBuilder,
        MathUtil
    ) {
        var ReceiveAdapter;

        ReceiveAdapter = function (physicalLayer) {
            var channelIndex, channelSize, stateMachineManager;

            this.$$physicalLayer = physicalLayer;
            this.$$stateMachineManager = [];
            this.$$packetReceiveHandler = null;
            this.$$frequencyUpdateHandler = null;
            this.$$phaseCorrectionUpdateHandler = null;
            
            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (channelIndex = 0; channelIndex < channelSize; channelIndex++) {
                stateMachineManager = RxStateMachineManagerBuilder.build(
                    channelIndex,
                    this.$$packetReceiveInternalHandler.bind(this),
                    this.$$frequencyUpdateInternalHandler.bind(this),
                    this.$$phaseCorrectionUpdateInternalHandler.bind(this)
                );
                this.$$stateMachineManager.push(stateMachineManager);
            }
            this.setSymbolDuration(DefaultConfig.SYMBOL_DURATION);
            this.setGuardInterval(DefaultConfig.GUARD_INTERVAL);
            this.setSyncDuration(DefaultConfig.SYNC_DURATION);
            this.setSampleCollectionTimeIdleInitState(ReceiveAdapter.$$_SAMPLE_COLLECTION_TIME_IDLE_INIT_STATE);
            this.setSampleCollectionTimeFirstSyncState(ReceiveAdapter.$$_SAMPLE_COLLECTION_TIME_FIRST_SYNC_STATE);
            this.setSyncPreamble(DefaultConfig.SYNC_PREAMBLE);
            this.setPskSize(ReceiveAdapter.$$_ALL_CHANNEL, DefaultConfig.PSK_SIZE);
        };

        ReceiveAdapter.$$_SAMPLE_COLLECTION_TIME_IDLE_INIT_STATE = DefaultConfig.SYNC_DURATION;
        ReceiveAdapter.$$_SAMPLE_COLLECTION_TIME_FIRST_SYNC_STATE = DefaultConfig.SYNC_DURATION * 0.85; // little less than 'Sync Duration' in order to finish signal collection before sync transmission ends
        ReceiveAdapter.$$_TIME_TOLERANCE_SYMBOL_DURATION_FACTOR = 2.2; // how much state times can be longer
        ReceiveAdapter.$$_TIME_TOLERANCE_GUARD_INTERVAL_FACTOR = 1.1; // how much state times can be longer
        ReceiveAdapter.$$_TIME_TOLERANCE_SYNC_DURATION_FACTOR = 1.1; // how much state times can be longer
        ReceiveAdapter.$$_ALL_CHANNEL = null;

        ReceiveAdapter.prototype.reset = function (channelIndex) {
            this.$$checkChannelIndexRange(channelIndex);
            return this.$$stateMachineManager[channelIndex].reset();
        };

        ReceiveAdapter.prototype.setSymbolDuration = function (value) {
            var channelSize, i;

            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSymbolStateMaxDurationTime(
                    value * ReceiveAdapter.$$_TIME_TOLERANCE_SYMBOL_DURATION_FACTOR
                );
            }
        };

        ReceiveAdapter.prototype.setGuardInterval = function (value) {
            var channelSize, i;

            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setGuardStateMaxDurationTime(
                    value * ReceiveAdapter.$$_TIME_TOLERANCE_GUARD_INTERVAL_FACTOR
                );
            }
        };

        ReceiveAdapter.prototype.setSyncDuration = function (value) {
            var channelSize, i;

            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSyncStateMaxDurationTime(
                    value * ReceiveAdapter.$$_TIME_TOLERANCE_SYNC_DURATION_FACTOR
                );
            }
        };

        ReceiveAdapter.prototype.setSampleCollectionTimeIdleInitState = function (value) {
            var channelSize, i;

            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSampleCollectionTimeIdleInitState(value);
            }
        };

        ReceiveAdapter.prototype.setSampleCollectionTimeFirstSyncState = function (value) {
            var channelSize, i;

            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSampleCollectionTimeFirstSyncState(value);
            }
        };

        ReceiveAdapter.prototype.setSyncPreamble = function (value) {
            var channelSize, i;

            value = !!value;
            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSyncPreamble(value);
            }
        };

        ReceiveAdapter.prototype.setPskSize = function (channelIndex, value) {
            var channelSize, i;

            if (channelIndex === ReceiveAdapter.$$_ALL_CHANNEL) {
                channelSize = this.$$physicalLayer.getRxChannelSize();
                for (i = 0; i < channelSize; i++) {
                    this.$$stateMachineManager[i].setPskSize(value);
                }
            } else {
                this.$$checkChannelIndexRange(channelIndex);
                this.$$stateMachineManager[channelIndex].setPskSize(value);
            }
        };

        ReceiveAdapter.prototype.$$packetReceiveInternalHandler = function (channelIndex, data) {
            var i;

            for (i = 0; i < data.length; i++) {
                if (data[i].length === 1) {
                    data[i] = data[i][0];      // flatten data structure when only one ofdm is used for this channel
                }
            }

            if (this.$$packetReceiveHandler) {
                this.$$packetReceiveHandler(channelIndex, data);
            }
        };

        ReceiveAdapter.prototype.$$frequencyUpdateInternalHandler = function (channelIndex, drift) {
            var current;

            if (drift === null) {
                return;
            }

            // TODO pass drift as array
            if (MathUtil.abs(drift) > 0.005) {
                current = this.$$physicalLayer.getRxFrequency(channelIndex, 0);
                console.log('phase history current', current);
                this.$$physicalLayer.setRxFrequency(channelIndex, 0, current + drift);
                console.log('Frequency corrected for channel ' + channelIndex + ' at ofdm ' + 0 + ': ' + (current + drift));
            }
            if (this.$$frequencyUpdateHandler) {
                this.$$frequencyUpdateHandler(channelIndex, drift);
            }  
        };

        ReceiveAdapter.prototype.$$phaseCorrectionUpdateInternalHandler = function (channelIndex, carrierDetail) {
            var current, i;

            // TODO pass only phase array not full carrierDetail object
            for (i = 0; i < carrierDetail.length; i++) {
                current = this.$$physicalLayer.getRxPhaseCorrection(channelIndex, i);
                this.$$physicalLayer.setRxPhaseCorrection(channelIndex, i, current + carrierDetail[i].phase);
                console.log('Phase corrected for channel ' + channelIndex + ' at ofdm ' + i + ': ' + (current + carrierDetail[i].phase));
            }

            if (this.$$phaseCorrectionUpdateHandler) {
                this.$$phaseCorrectionUpdateHandler(channelIndex, carrierDetail);
            }
        };
        
        ReceiveAdapter.prototype.$$checkChannelIndexRange = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.$$physicalLayer.getRxChannelSize()) {
                throw 'Given channelIndex is outside range: ' + channelIndex;
            }
        };

        ReceiveAdapter.prototype.setPacketReceiveHandler = function (cb) {
            if (typeof cb === 'function') {
                this.$$packetReceiveHandler = cb;
            } else {
                this.$$packetReceiveHandler = null;
            }
        };

        ReceiveAdapter.prototype.setFrequencyUpdateHandler = function (cb) {
            if (typeof cb === 'function') {
                this.$$frequencyUpdateHandler = cb;
            } else {
                this.$$frequencyUpdateHandler = null;
            }
        };

        ReceiveAdapter.prototype.setPhaseCorrectionUpdateHandler = function (cb) {
            if (typeof cb === 'function') {
                this.$$phaseCorrectionUpdateHandler = cb;
            } else {
                this.$$phaseCorrectionUpdateHandler = null;
            }
        };

        ReceiveAdapter.prototype.receive = function (channelIndex, carrierDetail, time) {
            this.$$checkChannelIndexRange(channelIndex);
            return this.$$stateMachineManager[channelIndex].receive(carrierDetail, time);
        };

        return ReceiveAdapter;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerAdapter.TransmitAdapter', _TransmitAdapter);

    _TransmitAdapter.$inject = [
        'Common.MathUtil',
        'Common.Util',
        'PhysicalLayer.DefaultConfig'
    ];

    function _TransmitAdapter(
        MathUtil,
        Util,
        DefaultConfig
    ) {
        var TransmitAdapter;

        /**
         * This works as an wrapper for raw API that PhysicalLayer provides.
         * It's much easier to send data using Adapter API. In case of really fancy sound
         * generation cases you can use PhysicalLayer API directly.
         *
         */
        TransmitAdapter = function (physicalLayer) {
            this.$$physicalLayer = physicalLayer;
        };

        TransmitAdapter.AMPLITUDE_DATA_LENGTH_DOES_NOT_MATCH_SYMBOL_LIST_LENGTH_EXCEPTION = 'Amplitude data length does not match symbol list length';
        TransmitAdapter.$$_SYNCHRONIZATION_SYMBOL = 0;
        TransmitAdapter.$$_LOWEST_PSK_SIZE = 1;
        TransmitAdapter.$$_ZERO_GUARD_INTERVAL = 0;
        TransmitAdapter.$$_ZERO_INTERPACKET_GAP = 0;
        TransmitAdapter.$$_NO_SYNC_PREAMBLE = false;
        TransmitAdapter.$$_UNDEFINED_AMPLITUDE = undefined;

        TransmitAdapter.prototype.symbol = function (channelIndex, ofdmIndex, symbol, pskSize, symbolDuration) {
            var
                ofdmSize = this.$$physicalLayer.getTxChannelOfdmSize(channelIndex),
                data = [],
                i
            ;

            for (i = 0; i < ofdmSize; i++) {
                data.push(i === ofdmIndex ? symbol : null);
            }
            data = [ data.length === 1 ? data[0] : data ];

            this.packet(
                channelIndex,
                data,
                TransmitAdapter.$$_NO_SYNC_PREAMBLE,
                pskSize,
                Util.valueOrDefault(symbolDuration, DefaultConfig.SYMBOL_DURATION),
                TransmitAdapter.$$_ZERO_GUARD_INTERVAL,
                TransmitAdapter.$$_ZERO_INTERPACKET_GAP,
                TransmitAdapter.$$_UNDEFINED_AMPLITUDE
            );
        };

        TransmitAdapter.prototype.packet = function (channelIndex, data, syncPreamble, pskSize, symbolDuration, guardInterval, interpacketGap, amplitude) {
            var 
                ofdmSize = this.$$physicalLayer.getTxChannelOfdmSize(channelIndex),
                syncData,
                i
            ;

            syncPreamble = Util.valueOrDefault(syncPreamble, DefaultConfig.SYNC_PREAMBLE);
            if (syncPreamble) {
                syncData = [];
                for (i = 0; i < ofdmSize; i++) {
                    syncData.push(TransmitAdapter.$$_SYNCHRONIZATION_SYMBOL);
                }
                syncData = syncData.length === 1 ? syncData[0] : syncData;
                data.unshift(syncData);
            }

            if (typeof amplitude === 'undefined') {
                amplitude = [];
                for (i = 0; i < ofdmSize; i++) {
                    amplitude.push(
                        MathUtil.floor(1000 / ofdmSize) / 1000
                    );
                }
            }

            this.$$transmit(
                channelIndex, 
                data,
                Util.valueOrDefault(pskSize, DefaultConfig.PSK_SIZE),
                Util.valueOrDefault(symbolDuration, DefaultConfig.SYMBOL_DURATION),
                Util.valueOrDefault(guardInterval, DefaultConfig.GUARD_INTERVAL),
                Util.valueOrDefault(interpacketGap, DefaultConfig.INTERPACKET_GAP),
                amplitude
            );
        };

        TransmitAdapter.prototype.synchronization = function (channelIndex) {
            var 
                ofdmSize = this.$$physicalLayer.getTxChannelOfdmSize(channelIndex),
                data = [],
                amplitude = [],
                i
            ;

            for (i = 0; i < ofdmSize; i++) {
                data.push(TransmitAdapter.$$_SYNCHRONIZATION_SYMBOL);
                amplitude.push(
                    MathUtil.floor(1000 / ofdmSize) / 1000
                );
            }
            data = [ data.length === 1 ? data[0] : data ];

            this.$$transmit(
                channelIndex, 
                data, 
                TransmitAdapter.$$_LOWEST_PSK_SIZE,
                DefaultConfig.SYNC_DURATION,
                TransmitAdapter.$$_ZERO_GUARD_INTERVAL,
                DefaultConfig.INTERPACKET_GAP,
                amplitude
            );
        };

        TransmitAdapter.prototype.$$transmit = function (channelIndex, data, pskSize, symbolDuration, guardInterval, interpacketGap, amplitude) {
            var
                ofdmSize = this.$$physicalLayer.getTxChannelOfdmSize(channelIndex),
                symbolList, symbol,
                txData, txDataTmp,
                mute,
                i, j
            ;

            txData = [];
            for (i = 0; i < data.length; i++) {
                // allow simpler data structure for ofdm-1 (nested arrays are not needed in this case)
                if (ofdmSize === 1 && typeof data[i] === 'number') {
                    symbolList = [ data[i] ];
                } else {
                    symbolList = data[i];
                }

                if (symbolList.length !== amplitude.length) {
                    throw TransmitAdapter.AMPLITUDE_DATA_LENGTH_DOES_NOT_MATCH_SYMBOL_LIST_LENGTH_EXCEPTION;
                }

                txDataTmp = [];
                for (j = 0; j < symbolList.length; j++) {
                    mute = symbolList[j] === null;
                    symbol = mute ? 0 : parseInt(symbolList[j]) % pskSize;

                    txDataTmp.push({
                        amplitude: mute ? 0 : amplitude[j],
                        duration: symbolDuration,
                        phase: symbol / pskSize
                    });
                }
                txData.push(txDataTmp);

                if (guardInterval > 0) {
                    txDataTmp = [];
                    for (j = 0; j < symbolList.length; j++) {
                        txDataTmp.push({
                            amplitude: 0,
                            duration: guardInterval
                        });
                    }
                    txData.push(txDataTmp);
                }
            }

            // add interpacket gap only when data loop above actually added something
            if (interpacketGap > 0 && symbolList) {
                txDataTmp = [];
                for (j = 0; j < symbolList.length; j++) {
                    txDataTmp.push({
                        amplitude: 0,
                        duration: interpacketGap
                    });
                }
                txData.push(txDataTmp);
            }

            for (i = 0; i < txData.length; i++) {
                this.$$physicalLayer.tx(channelIndex, txData[i]);
            }
        };

        return TransmitAdapter;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.Abstract2DVisualizer', _Abstract2DVisualizer);

    _Abstract2DVisualizer.$inject = [
        'Visualizer.AbstractVisualizer',
        'Common.Util'
    ];

    function _Abstract2DVisualizer(
        AbstractVisualizer,
        Util
    ) {
        var Abstract2DVisualizer;

        Abstract2DVisualizer = function (parentElement, width, height, colorAxis, colorCenteredCircle) {
            AbstractVisualizer.call(this, parentElement, width, height);

            this.$$colorAxis = Util.valueOrDefault(colorAxis, 'green');
            this.$$colorCenteredCircle = Util.valueOrDefault(colorCenteredCircle, '#DDD');
        };

        Abstract2DVisualizer.prototype = Object.create(AbstractVisualizer.prototype);
        Abstract2DVisualizer.prototype.constructor = Abstract2DVisualizer;

        Abstract2DVisualizer.prototype.$$drawCenteredCircle = function (radius) {
            var
                ctx = this.$$canvasContext,
                halfW = 0.5 * this.$$width,
                halfH = 0.5 * this.$$height;

            ctx.strokeStyle = this.$$colorCenteredCircle;
            ctx.beginPath();
            ctx.arc(
                halfW, halfH,
                radius,
                0, 2 * Math.PI, false
            );
            ctx.stroke();
        };

        Abstract2DVisualizer.prototype.$$drawAxis = function () {
            var
                ctx = this.$$canvasContext,
                w = this.$$width,
                h = this.$$height,
                halfW = 0.5 * w,
                halfH = 0.5 * h;

            ctx.strokeStyle = this.$$colorAxis;
            ctx.beginPath();
            ctx.moveTo(0, halfH);
            ctx.lineTo(w, halfH);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(halfW, 0);
            ctx.lineTo(halfW, h);
            ctx.closePath();
            ctx.stroke();
        };

        Abstract2DVisualizer.prototype.$$dropXYCache = function () {
            var i;

            for (i = 0; i < this.$$queue.getSize(); i++) {
                delete this.$$queue.getItem(i).$$cache;
            }
        };

        return Abstract2DVisualizer;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.AbstractVisualizer', _AbstractVisualizer);

    _AbstractVisualizer.$inject = [
        'Common.SimplePromiseBuilder'
    ];

    function _AbstractVisualizer(
        SimplePromiseBuilder
    ) {
        var AbstractVisualizer;

        AbstractVisualizer = function (parentElement, width, height) {
            this.$$parentElement = parentElement;
            this.$$width = width;
            this.$$height = height;
            this.$$canvasContext = null;
            this.$$destroyPromise = null;

            this.$$parentElement.innerHTML = this.$$renderTemplate();
            this.$$initCanvas();
            requestAnimationFrame(this.$$animationFrameHandler.bind(this));     // TODO wrap requestAnimationFrame
        };

        AbstractVisualizer.ABSTRACT_METHOD_CALLED_EXCEPTION = 'Abstract method called!';

        AbstractVisualizer.prototype.destroy = function () {
            if (this.$$destroyPromise) {
                return this.$$destroyPromise;
            }
            this.$$destroyPromise = SimplePromiseBuilder.build();

            return this.$$destroyPromise;
        };


        // TODO move it to dedicated service
        AbstractVisualizer.prototype.$$find = function (selector) {
            var jsObject = this.$$parentElement.querySelectorAll(selector);

            if (jsObject.length === 0) {
                throw 'Cannot $$find given selector';
            }

            return jsObject[0];
        };

        AbstractVisualizer.prototype.$$initCanvas = function () {
            var canvasElement = this.$$find('canvas');

            this.$$canvasContext = canvasElement.getContext("2d");
            this.$$canvasContext.lineWidth = 1;
        };

        AbstractVisualizer.prototype.$$animationFrameHandler = function () {
            if (this.$$destroyPromise) {
                this.$$parentElement.innerHTML = '';
                this.$$destroyPromise.resolve();
            } else {
                if (this.$$canvasContext) {
                    this.$$draw();
                }
                requestAnimationFrame(this.$$animationFrameHandler.bind(this));
            }
        };

        AbstractVisualizer.prototype.$$draw = function () {
            throw AbstractVisualizer.ABSTRACT_METHOD_CALLED_EXCEPTION;
        };

        AbstractVisualizer.prototype.$$renderTemplate = function () {
            throw AbstractVisualizer.ABSTRACT_METHOD_CALLED_EXCEPTION;
        };

        return AbstractVisualizer;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.AnalyserChartBuilder', _AnalyserChartBuilder);

    _AnalyserChartBuilder.$inject = [
        'Visualizer.AnalyserChart'
    ];

    function _AnalyserChartBuilder(
        AnalyserChart
    ) {

        function build(parentElement, analyser, height, colorData, colorAxis) {
            return new AnalyserChart(parentElement, analyser, height, colorData, colorAxis);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.AnalyserChartTemplateAxisX', _AnalyserChartTemplateAxisX);

    _AnalyserChartTemplateAxisX.$inject = [];

    function _AnalyserChartTemplateAxisX() {
        var html =
            '<span' +
            '    style="' +
            '        display: block;' +
            '        box-sizing: border-box;' +
            '        border-left: 1px solid {{ colorAxis }};' +
            '        position: absolute;' +
            '        width: {{ width }}px;' +
            '        top: 0px;' +
            '        left: {{ left }}px;' +
            '        "' +
            '    >' +
            '    {{ label }}' +
            '</span>'
        ;

        return {
            html: html
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.AnalyserChartTemplateMain', _AnalyserChartTemplateMain);

    _AnalyserChartTemplateMain.$inject = [];

    function _AnalyserChartTemplateMain() {
        var html =
            '<div' +
            '    class="analyser-container"' +
            '    style="' +
            '        overflow: hidden;' +
            '        width: {{ width }}px;' +
            '        height: {{ height }}px;' +
            '        position: relative;' +
            '    "' +
            '    >' +
            '    <canvas' +
            '        class="analyser-chart"' +
            '        style="' +
            '            width: {{ width }}px;' +
            '            height: {{ height }}px;' +
            '            position: absolute;' +
            '        "' +
            '        width="{{ width }}"' +
            '        height="{{ height }}"' +
            '        ></canvas>' +
            '    <div' +
            '        class="analyser-action"' +
            '        style="' +
            '            position: absolute;' +
            '        "' +
            '        >' +
            '        <a href="javascript:void(0)" class="analyser-action-fft256">FFT256</a>' +
            '        <a href="javascript:void(0)" class="analyser-action-fft512">FFT512</a>' +
            '        <a href="javascript:void(0)" class="analyser-action-fft1024">FFT1024</a>' +
            '        <a href="javascript:void(0)" class="analyser-action-fft2048">FFT2048</a>' +
            '        <a href="javascript:void(0)" class="analyser-action-fft4096">FFT4096</a>' +
            '        <a href="javascript:void(0)" class="analyser-action-fft8192">FFT8192</a>' +
            '        <a href="javascript:void(0)" class="analyser-action-fft16384">FFT16384</a>' +
            '        <a href="javascript:void(0)" class="analyser-action-freq-timedomain">Freq/TimeDomain</a>' +
            '        <a href="javascript:void(0)" class="analyser-action-freeze">Freeze</a>' +
            '    </div>' +
            '    <div ' +
            '        class="analyser-axis-x" ' +
            '        style="' +
            '            position: absolute;' +
            '            bottom: 0px;' +
            '            left: 0px;' +
            '            width: {{ width }}px;' +
            '        "' +
            '        ></div>' +
            '</div>'
        ;

        return {
            html: html
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.AnalyserChart', _AnalyserChart);

    _AnalyserChart.$inject = [
        'Visualizer.AnalyserChartTemplateAxisX',
        'Visualizer.AnalyserChartTemplateMain',
        'Common.SimplePromiseBuilder',
        'Audio.ActiveAudioContext',
        'Common.MathUtil'
    ];

    function _AnalyserChart(
        AnalyserChartTemplateAxisX,
        AnalyserChartTemplateMain,
        SimplePromiseBuilder,
        ActiveAudioContext,
        MathUtil
    ) {
        var AnalyserChart;

        AnalyserChart = function (parentElement, analyser, height, colorData, colorAxis) {
            this.$$parentElement = parentElement;
            this.$$analyser = analyser;
            this.$$canvas = null;
            this.$$canvasContext = null;
            this.$$canvasWidth = null;
            this.$$canvasHeight = height;
            this.$$colorData = colorData;
            this.$$colorAxis = colorAxis;
            this.$$data = null;
            this.$$freezeChart = false;
            this.$$analyserMethod = 'getByteFrequencyData';
            this.$$destroyPromise = null;

            this.$$initAnimationFrame();
            this.$$init();
        };

        AnalyserChart.$$_AXIS_LABEL_X_ONE_ITEM_WITH = 40;

        AnalyserChart.prototype.destroy = function () {
            if (this.$$destroyPromise) {
                return this.$$destroyPromise;
            }
            this.$$destroyPromise = SimplePromiseBuilder.build();

            return this.$$destroyPromise;
        };

        AnalyserChart.prototype.$$init = function () {
            this.$$canvasContext = null;
            this.$$parentElement.innerHTML = this.$$renderTemplate();
            this.$$connectTemplate();
            this.$$initCanvasContext();
        };

        // TODO move it to dedicated service
        AnalyserChart.prototype.$$find = function (selector) {
            var jsObject = this.$$parentElement.querySelectorAll(selector);

            if (jsObject.length === 0) {
                throw 'Cannot $$find given selector';
            }

            return jsObject[0];
        };

        AnalyserChart.prototype.$$connectTemplate = function () {
            var self = this;

            this.$$canvas = this.$$find('.analyser-chart');
            this.$$canvasContext = this.$$canvas.getContext("2d");
            this.$$canvasWidth = this.$$analyser.fftSize;

            this.$$find('.analyser-action-freq-timedomain').addEventListener('click', function () {
                self.actionFrequencyTimeDomainToggle();
            });
            this.$$find('.analyser-action-freeze').addEventListener('click', function () {
                self.actionFreezeChart();
            });
            this.$$find('.analyser-action-fft256').addEventListener('click', function () {
                self.actionChangeFFTSize(256);
            });
            this.$$find('.analyser-action-fft512').addEventListener('click', function () {
                self.actionChangeFFTSize(512);
            });
            this.$$find('.analyser-action-fft1024').addEventListener('click', function () {
                self.actionChangeFFTSize(1024);
            });
            this.$$find('.analyser-action-fft2048').addEventListener('click', function () {
                self.actionChangeFFTSize(2048);
            });
            this.$$find('.analyser-action-fft4096').addEventListener('click', function () {
                self.actionChangeFFTSize(4096);
            });
            this.$$find('.analyser-action-fft8192').addEventListener('click', function () {
                self.actionChangeFFTSize(8192);
            });
            this.$$find('.analyser-action-fft16384').addEventListener('click', function () {
                self.actionChangeFFTSize(16384);
            });
        };

        AnalyserChart.prototype.actionFrequencyTimeDomainToggle = function () {
            if (this.$$analyserMethod === 'getByteFrequencyData') {
                this.$$analyserMethod = 'getByteTimeDomainData';
            } else {
                this.$$analyserMethod = 'getByteFrequencyData';
            }

            this.$$generateAxisX();
        };

        AnalyserChart.prototype.actionFreezeChart = function () {
            this.$$freezeChart = !this.$$freezeChart;
        };

        AnalyserChart.prototype.actionChangeFFTSize = function (newFFTSize) {
            this.$$analyser.fftSize = newFFTSize;
            this.$$init();
        };

        AnalyserChart.prototype.$$renderTemplate = function () {
            var tpl = AnalyserChartTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$analyser.frequencyBinCount).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$canvasHeight).toString());

            return tpl;
        };

        AnalyserChart.prototype.$$renderTemplateAxisXLabel = function (width, left, label) {
            var tpl = AnalyserChartTemplateAxisX.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, width);
            tpl = tpl.replace(/\{\{ left \}\}/g, left);
            tpl = tpl.replace(/\{\{ label \}\}/g, label);
            tpl = tpl.replace(/\{\{ colorAxis \}\}/g, this.$$colorAxis);

            return tpl;
        };

        AnalyserChart.prototype.$$generateAxisXForTimeDomain = function () {
            var
              availableStep = [0.0005, 0.001, 0.002, 0.005, 0.010, 0.025, 0.050, 0.100, 0.250, 0.500],
              resolution = ActiveAudioContext.getSampleRate(),  // [pix/sec]
              step = AnalyserChart.$$_AXIS_LABEL_X_ONE_ITEM_WITH / resolution,
              time = 0,
              left,
              i,
              divContent = '';

            for (i = 0; i < availableStep.length; i++) {
                if (availableStep[i] >= step || i == availableStep.length - 1) {
                    step = availableStep[i];
                    break;
                }
            }

            while (time < (this.$$analyser.frequencyBinCount / ActiveAudioContext.getSampleRate())) {
                left = MathUtil.round(time * resolution);
                divContent += this.$$renderTemplateAxisXLabel(
                  AnalyserChart.$$_AXIS_LABEL_X_ONE_ITEM_WITH,
                  left,
                  MathUtil.round(time * 1000) + 'ms'
                );
                time += step;
            }

            return divContent;
        };

        AnalyserChart.prototype.$$generateAxisXForFrequency = function () {
            var
              availableStep = [50, 100, 125, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000],
              resolution = this.$$analyser.fftSize / ActiveAudioContext.getSampleRate(),  // [pix/Hz]
              step = AnalyserChart.$$_AXIS_LABEL_X_ONE_ITEM_WITH / resolution,
              frequency = 0,
              left,
              i,
              divContent = '';

            for (i = 0; i < availableStep.length; i++) {
                if (availableStep[i] >= step || i == availableStep.length - 1) {
                    step = availableStep[i];
                    break;
                }
            }

            while (frequency < 0.5 * ActiveAudioContext.getSampleRate()) {
                left = MathUtil.round(frequency * resolution);
                divContent += this.$$renderTemplateAxisXLabel(
                    AnalyserChart.$$_AXIS_LABEL_X_ONE_ITEM_WITH,
                    left,
                    frequency + 'Hz'
                );
                frequency += step;
            }

            return divContent;
        };

        AnalyserChart.prototype.$$generateAxisX = function () {
            var axisX = this.$$find('.analyser-axis-x');

            if (this.$$analyserMethod == 'getByteFrequencyData') {
                axisX.innerHTML = '<span>&nbsp;</span>' + this.$$generateAxisXForFrequency();
            } else {
                axisX.innerHTML = '<span>&nbsp;</span>' + this.$$generateAxisXForTimeDomain();
            }
        };

        AnalyserChart.prototype.$$updateChart = function () {
            var 
                length = this.$$data.length,
                ctx = this.$$canvasContext,
                i
            ;

            if (ctx === null || this.$$freezeChart) {
                return;
            }
            ctx.clearRect(0, 0, this.$$canvasWidth, this.$$canvasHeight);
            this.$$analyser[this.$$analyserMethod](this.$$data);
            for (i = 0; i < length; i++) {
                ctx.beginPath();
                ctx.moveTo(i, this.$$canvasHeight);
                ctx.lineTo(
                    i,
                    this.$$canvasHeight - MathUtil.round(this.$$canvasHeight * this.$$data[i] / 255)
                );
                ctx.closePath();
                ctx.stroke();
            }
        };

        AnalyserChart.prototype.$$initCanvasContext = function () {
            this.$$data = new Uint8Array(this.$$analyser.frequencyBinCount);
            this.$$generateAxisX();
            this.$$canvasContext.lineWidth = 1;
            this.$$canvasContext.strokeStyle = this.$$colorData;
        };

        AnalyserChart.prototype.$$initAnimationFrame = function () {
            var self = this;

            function drawAgain() {
                if (self.$$destroyPromise) {
                    self.$$parentElement.innerHTML = '';
                    self.$$destroyPromise.resolve();
                } else {
                    self.$$updateChart();
                    requestAnimationFrame(drawAgain);
                }
            }
            requestAnimationFrame(drawAgain);
        };

        return AnalyserChart;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.ComplexPlaneChartBuilder', _ComplexPlaneChartBuilder);

    _ComplexPlaneChartBuilder.$inject = [
        'Visualizer.ComplexPlaneChart'
    ];

    function _ComplexPlaneChartBuilder(
        ComplexPlaneChart
    ) {

        function build(parentElement, width, height, queue, maxValue, colorAxis, colorPowerLine) {
            return new ComplexPlaneChart(parentElement, width, height, queue, maxValue, colorAxis, colorPowerLine);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.ComplexPlaneChartTemplateMain', _ComplexPlaneChartTemplateMain);

    _ComplexPlaneChartTemplateMain.$inject = [];

    function _ComplexPlaneChartTemplateMain() {
        var html =
            '<div' +
            '    class="complex-plane-chart-container"' +
            '    style="' +
            '        overflow: hidden;' +
            '        width: {{ width }}px;' +
            '        height: {{ height }}px;' +
            '        position: relative;' +
            '    "' +
            '    >' +
            '    <canvas ' +
            '        class="complex-plane-chart"' +
            '        style="' +
            '            width: {{ width }}px;' +
            '            height: {{ height }}px;' +
            '            position: absolute;' +
            '        "' +
            '        width="{{ width }}"' +
            '        height="{{ height }}"' +
            '        ></canvas>' +
            '</div>'
        ;

        return {
            html: html
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.ComplexPlaneChart', _ComplexPlaneChart);

    _ComplexPlaneChart.$inject = [
        'Visualizer.Abstract2DVisualizer',
        'Common.Util',
        'Visualizer.ComplexPlaneChartTemplateMain'
    ];

    function _ComplexPlaneChart(
        Abstract2DVisualizer,
        Util,
        ComplexPlaneChartTemplateMain
    ) {
        var ComplexPlaneChart;

        ComplexPlaneChart = function (parentElement, width, height, queue, maxValue, colorAxis, colorPowerLine) {
            Abstract2DVisualizer.call(this, parentElement, width, height, colorAxis, colorPowerLine);

            this.$$queue = queue;
            this.$$maxValue = Util.valueOrDefault(maxValue, 1);

            this.$$hashOnCanvas = null;
        };

        ComplexPlaneChart.prototype = Object.create(Abstract2DVisualizer.prototype);
        ComplexPlaneChart.prototype.constructor = ComplexPlaneChart;

        ComplexPlaneChart.$$_VALUE_CIRCLE_STEP = 1;
        
        ComplexPlaneChart.prototype.setMaxValue = function (maxValue) {
            if (this.$$maxValue === maxValue) {
                return false;
            }
            this.$$maxValue = maxValue;
            this.$$hashOnCanvas = null;
            this.$$dropXYCache();

            return true;
        };

        ComplexPlaneChart.prototype.$$renderTemplate = function () {
            var tpl = ComplexPlaneChartTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$width).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$height).toString());

            return tpl;
        };

        ComplexPlaneChart.prototype.$$draw = function () {
            var
                ctx = this.$$canvasContext,
                w = this.$$width,
                h = this.$$height,
                halfW = 0.5 * w,
                halfH = 0.5 * h,
                q = this.$$queue,
                item,
                valueCircle,
                radius, x, y, i,
                lineWidth
            ;

            if (this.$$hashOnCanvas === q.getHash()) {
                return;
            }

            ctx.clearRect(0, 0, w, h);

            valueCircle = 0;
            while (valueCircle <= this.$$maxValue) {
                radius = halfH * this.$$getNormalizedValue(valueCircle);
                this.$$drawCenteredCircle(radius);
                valueCircle += ComplexPlaneChart.$$_VALUE_CIRCLE_STEP;
            }

            this.$$drawAxis();

            lineWidth = ctx.lineWidth;
            for (i = 0; i < q.getSize(); i++) {
                item = q.getItem(i);
                this.$$setItemXYCache(item);

                x = halfW + halfW * item.$$cache.x;
                y = halfH - halfH * item.$$cache.y;

                if (item.point) {
                    ctx.fillStyle = item.pointColor;
                    ctx.beginPath();
                    ctx.arc(x, y, item.pointRadius, 0, 2 * Math.PI, false);
                    ctx.fill();
                }

                if (item.line) {
                    ctx.lineWidth = item.lineWidth;
                    ctx.strokeStyle = item.lineColor;
                    ctx.beginPath();
                    ctx.moveTo(halfW, halfH);
                    ctx.lineTo(x, y);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
            ctx.lineWidth = lineWidth;

            this.$$hashOnCanvas = q.getHash();
        };

        ComplexPlaneChart.prototype.$$setItemXYCache = function (item) {
            if (item.$$cache) {
                return;
            }

            item.$$cache = {
                x: this.$$getNormalizedValue(item.real),
                y: this.$$getNormalizedValue(item.imm)
            };
        };

        ComplexPlaneChart.prototype.$$getNormalizedValue = function (value) {
            return value / this.$$maxValue;
        };

        return ComplexPlaneChart;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.ConstellationDiagramBuilder', _ConstellationDiagramBuilder);

    _ConstellationDiagramBuilder.$inject = [
        'Visualizer.ConstellationDiagram'
    ];

    function _ConstellationDiagramBuilder(
        ConstellationDiagram
    ) {

        function build(parentElement, width, height, queue, powerDecibelMin, colorAxis, colorHistoryPoint, colorPowerLine, radius, radiusMain) {
            return new ConstellationDiagram(parentElement, width, height, queue, powerDecibelMin, colorAxis, colorHistoryPoint, colorPowerLine, radius, radiusMain);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.ConstellationDiagramTemplateMain', _ConstellationDiagramTemplateMain);

    _ConstellationDiagramTemplateMain.$inject = [];

    function _ConstellationDiagramTemplateMain() {
        var html =
            '<div' +
            '    class="constellation-diagram-container"' +
            '    style="' +
            '        overflow: hidden;' +
            '        width: {{ width }}px;' +
            '        height: {{ height }}px;' +
            '        position: relative;' +
            '    "' +
            '    >' +
            '    <canvas ' +
            '        class="constellation-diagram"' +
            '        style="' +
            '            width: {{ width }}px;' +
            '            height: {{ height }}px;' +
            '            position: absolute;' +
            '        "' +
            '        width="{{ width }}"' +
            '        height="{{ height }}"' +
            '        ></canvas>' +
            '</div>'
        ;

        return {
            html: html
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.ConstellationDiagram', _ConstellationDiagram);

    _ConstellationDiagram.$inject = [
        'Visualizer.Abstract2DVisualizer',
        'Common.MathUtil',
        'Common.Util',
        'Visualizer.ConstellationDiagramTemplateMain'
    ];

    function _ConstellationDiagram(
        Abstract2DVisualizer,
        MathUtil,
        Util,
        ConstellationDiagramTemplateMain
    ) {
        var ConstellationDiagram;

        ConstellationDiagram = function (parentElement, width, height, queue, powerDecibelMin, colorAxis, colorHistoryPoint, colorPowerLine, radius, radiusMain) {
            Abstract2DVisualizer.call(this, parentElement, width, height, colorAxis, colorPowerLine);

            this.$$queue = queue;
            this.$$colorHistoryPoint = Util.valueOrDefault(
                colorHistoryPoint,
                {
                    red: {
                        newest: 0,
                        tailNewest: 100,
                        tailOldest: 180
                    },
                    green: {
                        newest: 0,
                        tailNewest: 100,
                        tailOldest: 200
                    },
                    blue: {
                        newest: 0,
                        tailNewest: 100,
                        tailOldest: 150
                    }
                }
            );
            this.$$radius = Util.valueOrDefault(radius, 2);
            this.$$radiusMain = Util.valueOrDefault(radiusMain, 3);
            this.$$powerDecibelMin = Util.valueOrDefault(powerDecibelMin, -40);

            this.$$hashOnCanvas = null;
        };

        ConstellationDiagram.prototype = Object.create(Abstract2DVisualizer.prototype);
        ConstellationDiagram.prototype.constructor = ConstellationDiagram;

        ConstellationDiagram.$$_POWER_DECIBEL_AXIS_LINE_STEP = 10;
        
        ConstellationDiagram.prototype.setPowerDecibelMin = function (powerDecibelMin) {
            if (this.$$powerDecibelMin === powerDecibelMin) {
                return false;
            }
            this.$$powerDecibelMin = powerDecibelMin;
            this.$$hashOnCanvas = null;
            this.$$dropXYCache();

            return true;
        };

        ConstellationDiagram.prototype.$$renderTemplate = function () {
            var tpl = ConstellationDiagramTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$width).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$height).toString());

            return tpl;
        };

        ConstellationDiagram.prototype.$$draw = function () {
            var
                chp = this.$$colorHistoryPoint,
                ctx = this.$$canvasContext,
                w = this.$$width,
                h = this.$$height,
                halfW = 0.5 * w,
                halfH = 0.5 * h,
                q = this.$$queue,
                item,
                powerDecibel,
                tailUnitPosition, color, radius, x, y, i, isNewest
            ;

            if (this.$$hashOnCanvas === q.getHash()) {
                return;
            }

            ctx.clearRect(0, 0, w, h);

            powerDecibel = 0;
            while (powerDecibel >= this.$$powerDecibelMin) {
                radius = halfH * this.$$getNormalizedPowerDecibel(powerDecibel);
                this.$$drawCenteredCircle(radius);
                powerDecibel -= ConstellationDiagram.$$_POWER_DECIBEL_AXIS_LINE_STEP;
            }

            this.$$drawAxis();

            // from oldest to newest
            for (i = 0; i < q.getSize(); i++) {
                item = q.getItem(i);
                this.$$setItemXYCache(item);

                //if (item.$$cache.outOfRange) {
                //    continue;
                //}

                x = halfW + halfW * item.$$cache.x;
                y = halfH - halfH * item.$$cache.y;
                tailUnitPosition = 1 - (i / (q.getSize() - 2));
                isNewest = (i === q.getSize() - 1);

                if (isNewest) {
                    color = (
                        'rgba(' + chp.red.newest + ', ' + chp.green.newest + ', ' + chp.blue.newest + ', ' + '1)'
                    );
                } else {
                    color = (
                        'rgba(' +
                        this.$$colorInterpolate(chp.red.tailNewest, chp.red.tailOldest, tailUnitPosition) + ', ' +
                        this.$$colorInterpolate(chp.green.tailNewest, chp.green.tailOldest, tailUnitPosition) + ', ' +
                        this.$$colorInterpolate(chp.blue.tailNewest, chp.blue.tailOldest, tailUnitPosition) + ', ' +
                        '1)'
                    );
                }

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(
                    x, y,
                    isNewest ? this.$$radiusMain : this.$$radius,
                    0, 2 * Math.PI, false
                );
                ctx.fill();
                /*
                ctx.fillRect(
                    x - (isNewest ? 2 : 1),
                    y - (isNewest ? 2 : 1),
                    (isNewest ? 5 : 3),
                    (isNewest ? 5 : 3)
                );
                */
            }

            this.$$hashOnCanvas = q.getHash();
        };

        ConstellationDiagram.prototype.$$getNormalizedPowerDecibel = function (powerDecibel) {
            var normalizedPowerDecibel;

            normalizedPowerDecibel = powerDecibel / this.$$powerDecibelMin;
            normalizedPowerDecibel = 1 - normalizedPowerDecibel;
            normalizedPowerDecibel = normalizedPowerDecibel < 0 ? null : normalizedPowerDecibel;

            return normalizedPowerDecibel;
        };

        ConstellationDiagram.prototype.$$setItemXYCache = function (item) {
            var normalizedPowerDecibel;

            if (item.$$cache) {
                return;
            }

            normalizedPowerDecibel = this.$$getNormalizedPowerDecibel(item.powerDecibel);
            item.$$cache = {
                x: normalizedPowerDecibel === null
                    ? 0
                    : (normalizedPowerDecibel * MathUtil.sin(MathUtil.TWO_PI * item.phase)),
                y: normalizedPowerDecibel === null
                    ? 0
                    : (normalizedPowerDecibel * MathUtil.cos(MathUtil.TWO_PI * item.phase)),
                outOfRange: normalizedPowerDecibel === null ? true : false
            };
        };

        ConstellationDiagram.prototype.$$colorInterpolate = function (start, end, unitPosition) {
            return MathUtil.round(start + ((end - start) * unitPosition));
        };

        return ConstellationDiagram;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.FrequencyDomainChartBuilder', _FrequencyDomainChartBuilder);

    _FrequencyDomainChartBuilder.$inject = [
        'Visualizer.FrequencyDomainChart'
    ];

    function _FrequencyDomainChartBuilder(
        FrequencyDomainChart
    ) {

        function build(parentElement, width, height, frequencyDomain, powerDecibelMin, radius, barWidth, barSpacingWidth, colorAxis, colorSample) {
            return new FrequencyDomainChart(parentElement, width, height, frequencyDomain, powerDecibelMin, radius, barWidth, barSpacingWidth, colorAxis, colorSample);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.FrequencyDomainChartTemplateMain', _FrequencyDomainChartTemplateMain);

    _FrequencyDomainChartTemplateMain.$inject = [];

    function _FrequencyDomainChartTemplateMain() {
        var html =
            '<div' +
            '    class="frequency-domain-chart-container"' +
            '    style="' +
            '        overflow: hidden;' +
            '        width: {{ width }}px;' +
            '        height: {{ height }}px;' +
            '        position: relative;' +
            '    "' +
            '    >' +
            '    <canvas ' +
            '        class="frequency-domain-chart"' +
            '        style="' +
            '            width: {{ width }}px;' +
            '            height: {{ height }}px;' +
            '            position: absolute;' +
            '        "' +
            '        width="{{ width }}"' +
            '        height="{{ height }}"' +
            '        ></canvas>' +
            '</div>'
        ;

        return {
            html: html
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.FrequencyDomainChart', _FrequencyDomainChart);

    _FrequencyDomainChart.$inject = [
        'Visualizer.AbstractVisualizer',
        'Visualizer.FrequencyDomainChartTemplateMain',
        'Common.Util'
    ];

    function _FrequencyDomainChart(
        AbstractVisualizer,
        FrequencyDomainChartTemplateMain,
        Util
    ) {
        var FrequencyDomainChart;

        FrequencyDomainChart = function (parentElement, width, height, frequencyDomainQueue, powerDecibelMin, radius, barWidth, barSpacingWidth, colorAxis, colorSample) {
            AbstractVisualizer.call(this, parentElement, width, height);

            this.$$frequencyDomainQueue = frequencyDomainQueue;
            this.$$powerDecibelMin = Util.valueOrDefault(powerDecibelMin, -40);
            this.$$radius = Util.valueOrDefault(radius, 1.1);
            this.$$barWidth = Util.valueOrDefault(barWidth, 1);
            this.$$barSpacingWidth = Util.valueOrDefault(barSpacingWidth, 0);
            this.$$colorAxis = Util.valueOrDefault(colorAxis, '#EEE');
            this.$$colorSample = Util.valueOrDefault(colorSample, '#738BD7');

            this.$$checkWidth();

            this.$$hashOnCanvas = null;
        };

        FrequencyDomainChart.prototype = Object.create(AbstractVisualizer.prototype);
        FrequencyDomainChart.prototype.constructor = FrequencyDomainChart;

        FrequencyDomainChart.QUEUE_SIZE_NOT_MATCH_CHART_WIDTH = 'Queue size not match chart width';
        FrequencyDomainChart.$$_POWER_DECIBEL_AXIS_LINE_STEP = 10;

        FrequencyDomainChart.prototype.setWidth = function (width) {
            var element;

            if (this.$$width === width) {
                return false;
            }

            this.$$width = width;
            this.$$checkWidth();

            element = this.$$find('.frequency-domain-chart-container');
            element.style.width = width + 'px';
            element = this.$$find('.frequency-domain-chart');
            element.style.width = width + 'px';
            element.setAttribute("width", width);

            this.$$hashOnCanvas = null;

            return true;
        };

        FrequencyDomainChart.prototype.$$checkWidth = function () {
            if (this.$$frequencyDomainQueue.getSizeMax() * (this.$$barWidth + this.$$barSpacingWidth) !== this.$$width) {
                throw FrequencyDomainChart.QUEUE_SIZE_NOT_MATCH_CHART_WIDTH;
            }
        };

        FrequencyDomainChart.prototype.$$renderTemplate = function () {
            var tpl = FrequencyDomainChartTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$width).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$height).toString());

            return tpl;
        };

        FrequencyDomainChart.prototype.setPowerDecibelMin = function (powerDecibelMin) {
            if (this.$$powerDecibelMin === powerDecibelMin) {
                return false;
            }
            this.$$powerDecibelMin = powerDecibelMin;
            this.$$hashOnCanvas = null;

            return true;
        };

        FrequencyDomainChart.prototype.$$draw = function () {
            var
                ctx = this.$$canvasContext,
                fdq = this.$$frequencyDomainQueue,
                w = this.$$width,
                h = this.$$height,
                frequencyBinPowerDecibel, i, x, y,
                barMiddle
            ;

            if (this.$$hashOnCanvas === fdq.getHash()) {
                return;
            }

            ctx.clearRect(0, 0, w, h);

            ctx.strokeStyle = this.$$colorAxis;
            for (i = 0; i <= -this.$$powerDecibelMin; i += FrequencyDomainChart.$$_POWER_DECIBEL_AXIS_LINE_STEP) {
                y = i *  h / -this.$$powerDecibelMin;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.closePath();
                ctx.stroke();
            }

            ctx.fillStyle = this.$$colorSample;
            barMiddle = 0.5 * (this.$$barWidth - 1);
            for (i = 0; i < fdq.getSize(); i++) {
                frequencyBinPowerDecibel = fdq.getItem(i);

                x = i * (this.$$barWidth + this.$$barSpacingWidth);
                y = ((frequencyBinPowerDecibel / this.$$powerDecibelMin)) * h;

                if (this.$$barSpacingWidth >= 1) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.closePath();
                    ctx.stroke();
                }

                if (y >= h) {
                    continue;
                }

                ctx.beginPath();
                ctx.arc(
                    x + this.$$barSpacingWidth + barMiddle, y,
                    this.$$radius, 0, 2 * Math.PI, false
                );
                ctx.fill();
                // ctx.fillRect(x - 1, y - 1, 3, 3);
            }

            this.$$hashOnCanvas = fdq.getHash();
        };

        FrequencyDomainChart.prototype.$$initCanvasContext = function () {
            this.$$canvasContext.lineWidth = 1;
        };

        return FrequencyDomainChart;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.PowerChartBuilder', _PowerChartBuilder);

    _PowerChartBuilder.$inject = [
        'Visualizer.PowerChart'
    ];

    function _PowerChartBuilder(
        PowerChart
    ) {

        function build(parentElement, width, height) {
            return new PowerChart(parentElement, width, height);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.PowerChartTemplateMain', _PowerChartTemplateMain);

    _PowerChartTemplateMain.$inject = [];

    function _PowerChartTemplateMain() {
        var html =
            '<div' +
            '    class="power-chart-container"' +
            '    style="' +
            '        overflow: hidden;' +
            '        width: {{ width }}px;' +
            '        height: {{ height }}px;' +
            '        position: relative;' +
            '    "' +
            '    >' +
            '    <canvas ' +
            '        class="power-chart"' +
            '        style="' +
            '            width: {{ width }}px;' +
            '            height: {{ height }}px;' +
            '            position: absolute;' +
            '        "' +
            '        width="{{ width }}"' +
            '        height="{{ height }}"' +
            '        ></canvas>' +
            '</div>'
        ;

        return {
            html: html
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.PowerChart', _PowerChart);

    _PowerChart.$inject = [
        'Visualizer.PowerChartTemplateMain',
        'Common.SimplePromiseBuilder'
    ];

    function _PowerChart(
        PowerChartTemplateMain,
        SimplePromiseBuilder
    ) {
        var PowerChart;

        PowerChart = function (parentElement, width, height, queue) {
            this.$$parentElement = parentElement;
            this.$$canvas = null;
            this.$$canvasContext = null;
            this.$$canvasWidth = width;
            this.$$canvasHeight = height;
            this.$$queue = queue;
            this.$$destroyPromise = null;
            
            this.$$initAnimationFrame();
            this.$$init();
        };

        PowerChart.prototype.destroy = function () {
            if (this.$$destroyPromise) {
                return this.$$destroyPromise;
            }
            this.$$destroyPromise = SimplePromiseBuilder.build();

            return this.$$destroyPromise;
        };

        PowerChart.prototype.$$init = function () {
            this.$$canvasContext = null;
            this.$$parentElement.innerHTML = this.$$renderTemplate();
            this.$$connectTemplate();
            this.$$initCanvasContext();
        };

        // TODO move it to dedicated service
        PowerChart.prototype.$$find = function (selector) {
            var jsObject = this.$$parentElement.querySelectorAll(selector);

            if (jsObject.length === 0) {
                throw 'Cannot $$find given selector';
            }

            return jsObject[0];
        };

        PowerChart.prototype.$$connectTemplate = function () {
            this.$$canvas = this.$$find('.power-chart');
            this.$$canvasContext = this.$$canvas.getContext("2d");
        };

        PowerChart.prototype.$$renderTemplate = function () {
            var tpl = PowerChartTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$canvasWidth).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$canvasHeight).toString());

            return tpl;
        };

        PowerChart.prototype.$$updateChart = function () {
            var
                ctx = this.$$canvasContext,
                q = this.$$queue,
                w = this.$$canvasWidth,
                h = this.$$canvasHeight,
                power, i, x, y
            ;

            if (ctx === null) {
                return;
            }

            ctx.clearRect(0, 0, w, h);

            for (y = 0; y < h; y += 10) {
                ctx.strokeStyle = '#EEE';          // TODO add ability to set colors via configuration object
                ctx.beginPath();
                ctx.moveTo(0, 2 * y);
                ctx.lineTo(w, 2 * y);
                ctx.closePath();
                ctx.stroke();
            }

            for (i = 0; i < q.getSize(); i++) {
                power = q.getItem(i);

                x = i;
                y = -power;

                ctx.fillStyle = '#738BD7';     // TODO add ability to set colors via configuration object
                ctx.fillRect(
                    x - 1,
                    2 * y - 1,
                    3,
                    3
                );
            }
        };

        PowerChart.prototype.$$initCanvasContext = function () {
            this.$$canvasContext.lineWidth = 1;
        };

        PowerChart.prototype.$$initAnimationFrame = function () {
            var self = this;

            function drawAgain() {
                if (self.$$destroyPromise) {
                    self.$$parentElement.innerHTML = '';
                    self.$$destroyPromise.resolve();
                } else {
                    self.$$updateChart();
                    requestAnimationFrame(drawAgain);
                }
            }
            requestAnimationFrame(drawAgain);
        };

        return PowerChart;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.SampleChartBuilder', _SampleChartBuilder);

    _SampleChartBuilder.$inject = [
        'Visualizer.SampleChart'
    ];

    function _SampleChartBuilder(
        SampleChart
    ) {

        function build(parentElement, width, height, queue, radius, barWidth, barSpacingWidth, colorAxis, colorSample, colorBar) {
            return new SampleChart(parentElement, width, height, queue, radius, barWidth, barSpacingWidth, colorAxis, colorSample, colorBar);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.SampleChartTemplateMain', _SampleChartTemplateMain);

    _SampleChartTemplateMain.$inject = [];

    function _SampleChartTemplateMain() {
        var html =
            '<div' +
            '    class="sample-chart-container"' +
            '    style="' +
            '        overflow: hidden;' +
            '        width: {{ width }}px;' +
            '        height: {{ height }}px;' +
            '        position: relative;' +
            '    "' +
            '    >' +
            '    <canvas ' +
            '        class="sample-chart"' +
            '        style="' +
            '            width: {{ width }}px;' +
            '            height: {{ height }}px;' +
            '            position: absolute;' +
            '        "' +
            '        width="{{ width }}"' +
            '        height="{{ height }}"' +
            '        ></canvas>' +
            '</div>'
        ;

        return {
            html: html
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.SampleChart', _SampleChart);

    _SampleChart.$inject = [
        'Visualizer.AbstractVisualizer',
        'Visualizer.SampleChartTemplateMain',
        'Common.Util'
    ];

    function _SampleChart(
        AbstractVisualizer,
        SampleChartTemplateMain,
        Util
    ) {
        var SampleChart;

        SampleChart = function (parentElement, width, height, queue, radius, barWidth, barSpacingWidth, colorAxis, colorSample, colorBar) {
            AbstractVisualizer.call(this, parentElement, width, height);

            this.$$queue = queue;
            this.$$radius = Util.valueOrDefault(radius, 1.1);
            this.$$barWidth = Util.valueOrDefault(barWidth, 1);
            this.$$barSpacingWidth = Util.valueOrDefault(barSpacingWidth, 0);
            this.$$colorAxis = Util.valueOrDefault(colorAxis, '#EEE');
            this.$$colorSample = Util.valueOrDefault(colorSample, 'rgba(115, 139, 215, 1.0');
            this.$$colorBar = Util.valueOrDefault(colorBar, 'rgba(115, 139, 215, 0.9)');

            this.$$sampleBackgroundActive = false;

            this.$$checkWidth();

            this.$$hashOnCanvas = null;
        };

        SampleChart.prototype = Object.create(AbstractVisualizer.prototype);
        SampleChart.prototype.constructor = SampleChart;

        SampleChart.QUEUE_SIZE_NOT_MATCH_CHART_WIDTH = 'Queue size not match chart width';

        SampleChart.prototype.setWidth = function (width) {
            var element;

            if (this.$$width === width) {
                return false;
            }

            this.$$width = width;
            this.$$checkWidth();

            element = this.$$find('.sample-chart-container');
            element.style.width = width + 'px';
            element = this.$$find('.sample-chart');
            element.style.width = width + 'px';
            element.setAttribute("width", width);

            this.$$hashOnCanvas = null;

            return true;
        };

        SampleChart.prototype.enableSampleBackground = function () {
            if (this.$$sampleBackgroundActive) {
                return false;
            }

            this.$$sampleBackgroundActive = true;
            this.$$hashOnCanvas = null;

            return true;
        };

        SampleChart.prototype.$$checkWidth = function () {
            if (this.$$queue.getSizeMax() * (this.$$barWidth + this.$$barSpacingWidth) !== this.$$width) {
                throw SampleChart.QUEUE_SIZE_NOT_MATCH_CHART_WIDTH;
            }
        };

        SampleChart.prototype.$$renderTemplate = function () {
            var tpl = SampleChartTemplateMain.html;

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$width).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$height).toString());

            return tpl;
        };

        SampleChart.prototype.$$draw = function () {
            var
                ctx = this.$$canvasContext,
                q = this.$$queue,
                w = this.$$width,
                h = this.$$height,
                hHalf = this.$$height * 0.5,
                sample, i, x, y, barMiddle
            ;

            if (this.$$hashOnCanvas === q.getHash()) {
                return;
            }

            ctx.clearRect(0, 0, w, h);

            // draw horizontal axis
            ctx.strokeStyle = this.$$colorAxis;
            ctx.beginPath();
            ctx.moveTo(0, hHalf);
            ctx.lineTo(w, hHalf);
            ctx.closePath();
            ctx.stroke();

            barMiddle = 0.5 * (this.$$barWidth - 1);
            for (i = 0; i < q.getSize(); i++) {
                sample = q.getItem(i);

                x = i * (this.$$barWidth + this.$$barSpacingWidth);
                y = (0.5 - 0.5 * sample) * h;

                if (this.$$barSpacingWidth > 0) {
                    // draw bar spacing
                    if (this.$$barSpacingWidth === 1) {
                        ctx.strokeStyle = this.$$colorAxis;
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, h);
                        ctx.closePath();
                        ctx.stroke();
                    } else {
                        ctx.fillStyle = this.$$colorAxis;
                        ctx.fillRect(
                            x, 0,
                            this.$$barSpacingWidth, h
                        );
                    }
                }

                if (this.$$sampleBackgroundActive) {
                    // draw sample-origin background
                    if (this.$$barWidth === 1) {
                        ctx.strokeStyle = this.$$colorBar;
                        ctx.beginPath();
                        ctx.moveTo(x + this.$$barSpacingWidth, hHalf);
                        ctx.lineTo(x + this.$$barSpacingWidth, y);
                        ctx.closePath();
                        ctx.stroke();
                    } else {
                        ctx.fillStyle = this.$$colorBar;
                        ctx.fillRect(
                            x + this.$$barSpacingWidth,
                            hHalf < y ? hHalf : y,
                            this.$$barWidth,
                            hHalf < y ? (y - hHalf) : (hHalf - y)
                        );
                    }
                }

                // draw sample circle
                ctx.fillStyle = this.$$colorSample;
                ctx.beginPath();
                ctx.arc(
                    x + this.$$barSpacingWidth + barMiddle, y,
                    this.$$radius, 0, 2 * Math.PI, false
                );
                ctx.fill();
            }

            this.$$hashOnCanvas = q.getHash();
        };

        SampleChart.prototype.$$initCanvasContext = function () {
            this.$$canvasContext.lineWidth = 1;
        };

        return SampleChart;
    }

})();
// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Audio.ActiveAudioContext', _ActiveAudioContext);

    _ActiveAudioContext.$inject = [
        'Audio.SimpleAudioContextBuilder'
    ];

    function _ActiveAudioContext(
        SimpleAudioContextBuilder
    ) {
        var simpleAudioContext = null;

        function $$init() {
            simpleAudioContext = SimpleAudioContextBuilder.build();
        }

        function initializeCheck() {
            if (simpleAudioContext === null) {
                $$init();
            }
        }

        function loadRecordedAudio(url) {
            initializeCheck();
            return simpleAudioContext.loadRecordedAudio(url);
        }

        function getMicrophoneNode() {
            initializeCheck();
            return simpleAudioContext.getMicrophoneNode();
        }

        function getRecordedAudioNode() {
            initializeCheck();
            return simpleAudioContext.getRecordedAudioNode();
        }

        function getSampleRate() {
            initializeCheck();
            return simpleAudioContext.getSampleRate();
        }

        function getDestination() {
            initializeCheck();
            return simpleAudioContext.getDestination();
        }

        function getCurrentTime() {
            initializeCheck();
            return simpleAudioContext.getCurrentTime();
        }

        function createAnalyser() {
            initializeCheck();
            return simpleAudioContext.createAnalyser();
        }

        function createGain() {
            initializeCheck();
            return simpleAudioContext.createGain();
        }

        function createScriptProcessor() {
            initializeCheck();
            return simpleAudioContext.createScriptProcessor();
        }

        return {
            loadRecordedAudio: loadRecordedAudio,
            getMicrophoneNode: getMicrophoneNode,
            getRecordedAudioNode: getRecordedAudioNode,
            getSampleRate: getSampleRate,
            getDestination: getDestination,
            getCurrentTime: getCurrentTime,
            createAnalyser: createAnalyser,
            createGain: createGain,
            createScriptProcessor: createScriptProcessor
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Audio.SimpleAudioContextBuilder', _SimpleAudioContextBuilder);

    _SimpleAudioContextBuilder.$inject = [
        'Audio.SimpleAudioContext'
    ];

    function _SimpleAudioContextBuilder(
        SimpleAudioContext
    ) {

        function build() {
            return new SimpleAudioContext();
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Audio.SimpleAudioContext', _SimpleAudioContext);

    _SimpleAudioContext.$inject = [
        'Common.SimplePromiseBuilder'
    ];

    function _SimpleAudioContext(
        SimplePromiseBuilder
    ) {
        var SimpleAudioContext;

        SimpleAudioContext = function () {
            this.$$context = null;
            this.$$rawMicrophoneNode = null;
            this.$$microphoneNode = null;
            this.$$recordedNode = null;
            this.$$recordedRawNode = null;
            this.$$init();
        };

        SimpleAudioContext.prototype.getCurrentTime = function () {
            return this.$$context.currentTime;
        };

        SimpleAudioContext.prototype.createAnalyser = function () {
            return this.$$context.createAnalyser();
        };

        SimpleAudioContext.prototype.createGain = function () {
            return this.$$context.createGain();
        };

        SimpleAudioContext.prototype.createScriptProcessor = function (bufferSize, numberOfInputChannels, numberOfOutputChannels) {
            return this.$$context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
        };

        SimpleAudioContext.prototype.getSampleRate = function () {
            return this.$$context.sampleRate;
        };

        SimpleAudioContext.prototype.getDestination = function () {
            return this.$$context.destination;
        };

        SimpleAudioContext.prototype.getMicrophoneNode = function () {
            return this.$$microphoneNode;
        };

        SimpleAudioContext.prototype.getRecordedAudioNode = function () {
            return this.$$recordedNode;
        };

        SimpleAudioContext.prototype.loadRecordedAudio = function (url) {
            var
                self = this,
                request = new XMLHttpRequest(),
                promise = SimplePromiseBuilder.build();

            request.open('GET', url, true);
            request.responseType = 'arraybuffer';

            request.onload = function() {
                self.$$context.decodeAudioData(
                    request.response,
                    function (buffer) {
                        if (self.$$recordedRawNode) {
                            self.$$recordedRawNode.disconnect(self.$$recordedNode);
                        }

                        self.$$recordedRawNode = self.$$context.createBufferSource();
                        self.$$recordedRawNode.buffer = buffer;
                        self.$$recordedRawNode.connect(self.$$recordedNode);
                        self.$$recordedRawNode.loop = true;
                        self.$$recordedRawNode.start(0);

                        promise.resolve();
                    },
                    function (e) {
                        promise.reject(e);
                    }
                );
            };
            request.send();

            return promise;
        };

        SimpleAudioContext.prototype.$$getConstraints = function () {
            return {
                video: false,
                audio: {
                    mandatory: {
                        googEchoCancellation: false, // disabling audio processing
                        googAutoGainControl: false,
                        googNoiseSuppression: false,
                        googHighpassFilter: false
                    },
                    optional: []
                }
            };
        };

        SimpleAudioContext.prototype.$$normalizeGlobalVariable = function () {
            window.AudioContext =
                window.AudioContext ||
                window.webkitAudioContext ||
                window.mozAudioContext;
            navigator.getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;
        };

        SimpleAudioContext.prototype.$$init = function () {
            var self = this;

            this.$$normalizeGlobalVariable();

            try {
                this.$$context = new window.AudioContext();
            } catch (e) {
                alert('Web Audio API is not supported in this browser');
                console.log(e);
            }

            this.$$microphoneNode = this.$$context.createGain();
            this.$$recordedNode = this.$$context.createGain();
            try {
                navigator.getUserMedia(
                    this.$$getConstraints(),
                    function (stream) {
                        self.$$rawMicrophoneNode = self.$$context.createMediaStreamSource(stream);
                        self.$$rawMicrophoneNode.connect(self.$$microphoneNode);
                    },
                    function (e) {
                        alert('Microphone initialization failed');
                        console.log(e);
                    }
                );
            } catch (e) {
                alert('Microphone initialization failed');
                console.log(e);
            }
        };

        return SimpleAudioContext;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.AbstractValueCollector', _AbstractValueCollector);

    _AbstractValueCollector.$inject = [];

    function _AbstractValueCollector() {
        var AbstractValueCollector;

        AbstractValueCollector = function () {
            this.$$valueList = [];
            this.$$lastFinalizedSize = undefined;
            this.$$lastFinalizedResult = undefined;
        };

        AbstractValueCollector.ABSTRACT_METHOD_CALLED_EXCEPTION = 'Abstract method called!';

        AbstractValueCollector.prototype.collect = function (value) {
            this.$$valueList.push(value);
        };

        AbstractValueCollector.prototype.hasAtLeastItem = function () {
            return this.getSize() > 0;
        };

        AbstractValueCollector.prototype.getSize = function () {
            return this.$$valueList.length;
        };

        AbstractValueCollector.prototype.clearAll = function () {
            this.clearList();
            this.$$lastFinalizedSize = undefined;
            this.$$lastFinalizedResult = undefined;
        };

        AbstractValueCollector.prototype.clearList = function () {
            this.$$valueList.length = 0;
        };

        AbstractValueCollector.prototype.finalize = function () {
            this.$$lastFinalizedResult = this.$$finalize(); // $$finalize() method may throw error BEFORE assignment
            this.$$lastFinalizedSize = this.getSize();
            this.clearList();

            return this.$$lastFinalizedResult;
        };

        /**
         * Returns list size that was used to compute last successful result from finalize method.
         */
        AbstractValueCollector.prototype.getLastFinalizedSize = function () {
            return this.$$lastFinalizedSize;
        };

        /**
         * Returns last successful result from finalize method.
         */
        AbstractValueCollector.prototype.getLastFinalizedResult = function () {
            return this.$$lastFinalizedResult;
        };

        AbstractValueCollector.prototype.$$finalize = function () {
            throw AbstractValueCollector.ABSTRACT_METHOD_CALLED_EXCEPTION;
        };

        return AbstractValueCollector;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.AverageValueCollectorBuilder', _AverageValueCollectorBuilder);

    _AverageValueCollectorBuilder.$inject = [
        'Common.AverageValueCollector'
    ];

    function _AverageValueCollectorBuilder(
        AverageValueCollector
    ) {

        function build() {
            return new AverageValueCollector();
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.AverageValueCollector', _AverageValueCollector);

    _AverageValueCollector.$inject = [
        'Common.AbstractValueCollector',
        'Common.Util'
    ];

    function _AverageValueCollector(
        AbstractValueCollector,
        Util
    ) {
        var AverageValueCollector;

        AverageValueCollector = function () {
            AbstractValueCollector.apply(this, arguments);
        };

        AverageValueCollector.prototype = Object.create(AbstractValueCollector.prototype);
        AverageValueCollector.prototype.constructor = AverageValueCollector;

        AverageValueCollector.EMPTY_LIST_EXCEPTION = 'Cannot finalize AverageValueCollector without any samples collected';

        AverageValueCollector.prototype.$$finalize = function () {
            if (this.$$valueList.length === 0) {
                throw AverageValueCollector.EMPTY_LIST_EXCEPTION;
            }

            return Util.computeAverage(this.$$valueList);
        };

        return AverageValueCollector;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.CarrierGenerateBuilder', _CarrierGenerateBuilder);

    _CarrierGenerateBuilder.$inject = [
        'Common.CarrierGenerate'
    ];

    function _CarrierGenerateBuilder(
        CarrierGenerate
    ) {

        function build(samplePerPeriod) {
            return new CarrierGenerate(samplePerPeriod);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.CarrierGenerate', _CarrierGenerate);

    _CarrierGenerate.$inject = [
        'Common.MathUtil',
        'Common.Util'
    ];

    function _CarrierGenerate(
        MathUtil,
        Util
    ) {
        var CarrierGenerate;

        CarrierGenerate = function (samplePerPeriod, samplePerFade) {
            this.$$samplePerFade = samplePerFade;
            this.$$queue = [];
            this.$$sampleComputed = null;
            this.$$currentCarrier = {
                data: null,
                sampleNumberStart: null,
                sampleNumberEnd: null
            };

            this.$$samplePerPeriod = null;
            this.$$omega = null;
            this.$$sampleNumber = 0;
            this.$$phaseCorrection = 0;
            this.setSamplePerPeriod(samplePerPeriod);
        };

        CarrierGenerate.prototype.$$sampleCompute = function () {
            var
                currentCarrierData = this.$$currentCarrier.data,
                fadeFactor,
                fadePositionStart,
                fadePositionEnd
            ;

            if (!currentCarrierData) {
                this.$$sampleComputed = 0;
                return;
            }

            fadeFactor = 1.0;
            if (this.$$samplePerFade > 0) {
                fadePositionStart = (this.$$sampleNumber - this.$$currentCarrier.sampleNumberStart) / this.$$samplePerFade;
                fadePositionEnd = (this.$$currentCarrier.sampleNumberEnd - this.$$sampleNumber) / this.$$samplePerFade;

                if (fadePositionStart >= 0 && fadePositionStart <= 1) {
                    fadeFactor = Util.unitFade(fadePositionStart);
                } else {
                    if (fadePositionEnd >= 0 && fadePositionEnd <= 1) {
                        fadeFactor = Util.unitFade(fadePositionEnd);
                    }
                }
            }

            this.$$sampleComputed = (
                fadeFactor *
                currentCarrierData.amplitude *
                MathUtil.sin(                                // TODO: consider changing to cosine
                    this.$$omega * this.$$sampleNumber
                    - MathUtil.TWO_PI * (currentCarrierData.phase - this.$$phaseCorrection)
                )
            );
        };

        CarrierGenerate.prototype.$$grabCurrentCarrier = function () {
            var fromQueue, isSameAsBefore;

            fromQueue = Util.queuePop(this.$$queue);
            if (fromQueue) {
                isSameAsBefore = (fromQueue === this.$$currentCarrier.data);
                if (!isSameAsBefore) {
                    this.$$currentCarrier.data = fromQueue;
                    this.$$currentCarrier.sampleNumberStart = this.$$sampleNumber;
                    this.$$currentCarrier.sampleNumberEnd = (
                        this.$$currentCarrier.sampleNumberStart + fromQueue.duration
                    );
                }
            } else {
                this.$$currentCarrier.data = null;
                this.$$currentCarrier.sampleNumberStart = null;
                this.$$currentCarrier.sampleNumberEnd = null;
            }
        };

        CarrierGenerate.prototype.setPhaseCorrection = function (phaseCorrection) {
            this.$$phaseCorrection = phaseCorrection;
        };

        CarrierGenerate.prototype.nextSample = function () {
            this.$$sampleNumber++;
            this.$$sampleComputed = null;
        };

        CarrierGenerate.prototype.getSample = function () {
            if (this.$$sampleComputed) {       // TODO fix me, 0 will not pass but this is valid sample!!!
                return this.$$sampleComputed;
            }

            this.$$grabCurrentCarrier();
            this.$$sampleCompute();

            return this.$$sampleComputed;
        };

        CarrierGenerate.prototype.addToQueue = function (carrierData) {
            Util.queueAdd(
                this.$$queue,
                carrierData,
                function (queueItem, item) {
                    queueItem.amplitude = item.amplitude;
                    queueItem.phase = item.phase;
                }
            );
        };

        CarrierGenerate.prototype.reset = function () {
            this.$$sampleNumber = 0;
        };

        CarrierGenerate.prototype.setSamplePerPeriod = function (samplePerPeriod) {
            if (samplePerPeriod === this.$$samplePerPeriod) {
                return false;
            }
            this.$$samplePerPeriod = samplePerPeriod;
            this.$$omega = MathUtil.TWO_PI / this.$$samplePerPeriod;  // revolutions per sample
            this.$$sampleNumber = 0;
            
            return true;
        };

        return CarrierGenerate;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.CarrierRecoveryBuilder', _CarrierRecoveryBuilder);

    _CarrierRecoveryBuilder.$inject = [
        'Common.CarrierRecovery'
    ];

    function _CarrierRecoveryBuilder(
        CarrierRecovery
    ) {

        function build(samplePerPeriod, samplePerDftWindow) {
            return new CarrierRecovery(samplePerPeriod, samplePerDftWindow);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.CarrierRecovery', _CarrierRecovery);

    _CarrierRecovery.$inject = [
        'Common.QueueBuilder',
        'Common.MathUtil',
        'Common.Util',
        'Common.ComplexBuilder'
    ];

    function _CarrierRecovery(
        QueueBuilder,
        MathUtil,
        Util,
        ComplexBuilder
    ) {
        var CarrierRecovery;

        CarrierRecovery = function (samplePerPeriod, samplePerDftWindow) {
            this.$$samplePerDftWindow = undefined;
            this.$$complexQueue = undefined;
            this.$$complexQueueSum = undefined;
            this.setSamplePerDftWindow(samplePerDftWindow);

            this.$$samplePerPeriod = undefined;
            this.$$omega = undefined;
            this.$$sampleNumber = undefined;
            this.setSamplePerPeriod(samplePerPeriod);
        };

        CarrierRecovery.prototype.$$getUnitComplex = function () {
            var r = this.$$omega * this.$$sampleNumber;

            return ComplexBuilder.build(
                -MathUtil.cos(r),
                MathUtil.sin(r)
            );
        };

        CarrierRecovery.prototype.handleSample = function (sample) {
            var oldComplex, newComplex;

            if (this.$$complexQueue.isFull()) {
                oldComplex = this.$$complexQueue.pop();
                this.$$complexQueueSum.sub(oldComplex);
            }
            newComplex = this.$$getUnitComplex();
            newComplex.mulScalar(sample);
            this.$$complexQueue.push(newComplex);
            this.$$complexQueueSum.add(newComplex);
            this.$$sampleNumber++;
        };

        CarrierRecovery.prototype.getCarrierDetail = function () {
            var complex = ComplexBuilder.copy(this.$$complexQueueSum);

            complex.divScalar(this.$$complexQueue.getSize());

            return {
                phase: complex.findUnitAngle(),
                powerDecibel: Util.convertToDecibel(complex.getAbsoluteValue())
            };
        };

        CarrierRecovery.prototype.setSamplePerDftWindow = function (samplePerDftWindow) {
            if (samplePerDftWindow === this.$$samplePerDftWindow) {
                return false;
            }
            this.$$samplePerDftWindow = samplePerDftWindow;
            this.$$complexQueue = QueueBuilder.build(samplePerDftWindow);
            this.$$complexQueueSum = ComplexBuilder.build(0, 0);

            return true;
        };

        CarrierRecovery.prototype.setSamplePerPeriod = function (samplePerPeriod) {
            if (samplePerPeriod === this.$$samplePerPeriod) {
                return false;
            }
            this.$$samplePerPeriod = samplePerPeriod;
            this.$$omega = MathUtil.TWO_PI / this.$$samplePerPeriod;  // revolutions per sample
            this.$$sampleNumber = 0;

            return true;
        };

        return CarrierRecovery;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.ComplexBuilder', _ComplexBuilder);

    _ComplexBuilder.$inject = [
        'Common.Complex'
    ];

    function _ComplexBuilder(
        Complex
    ) {

        function build(real, imm) {
            return new Complex(real, imm);
        }

        function copy(complex) {
            return new Complex(complex.real, complex.imm);
        }

        return {
            build: build,
            copy: copy
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.Complex', _Complex);

    _Complex.$inject = [
        'Common.Util',
        'Common.MathUtil'
    ];

    function _Complex(
        Util,
        MathUtil
    ) {
        var Complex;

        Complex = function (real, imm) {
            this.real = real;
            this.imm = imm;
        };

        Complex.prototype.add = function (complex) {
            this.real += complex.real;
            this.imm += complex.imm;
        };

        Complex.prototype.sub = function (complex) {
            this.real -= complex.real;
            this.imm -= complex.imm;
        };

        Complex.prototype.mulScalar = function (n) {
            this.real *= n;
            this.imm *= n;
        };

        Complex.prototype.divScalar = function (n) {
            this.real /= n;
            this.imm /= n;
        };

        Complex.prototype.getAbsoluteValue = function () {
            return MathUtil.sqrt(
                this.real * this.real +
                this.imm * this.imm
            );
        };

        Complex.prototype.findUnitAngle = function () {
            return Util.findUnitAngle(this.real, this.imm);
        };

        return Complex;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.QueueBuilder', _QueueBuilder);

    _QueueBuilder.$inject = [
        'Common.Queue'
    ];

    function _QueueBuilder(
        Queue
    ) {

        function build(size) {
            return new Queue(size);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.Queue', _Queue);

    _Queue.$inject = [
        'Common.MathUtil'
    ];

    function _Queue(
        MathUtil
    ) {
        var Queue;

        Queue = function (sizeMax) {
            this.$$data = [];
            this.$$positionStart = null;
            this.$$positionEnd = null;
            this.$$size = null;
            this.$$hash = null;
            this.$$sizeMax = null;
            this.setSizeMax(sizeMax);
        };

        Queue.prototype.$$generateNewHash = function () {
            this.$$hash = MathUtil.random() * 1000000;
        };

        Queue.prototype.setSizeMax = function (sizeMax) {
            this.$$positionStart = 0;
            this.$$positionEnd = 0;
            this.$$size = 0;
            this.$$hash = 0;
            this.$$sizeMax = sizeMax;
            this.$$data.length = 0;        // drop all data
            this.$$data.length = sizeMax;
        };

        Queue.prototype.getHash = function () {
            return this.$$hash;
        };

        Queue.prototype.push = function (value) {
            if (this.$$size === this.$$sizeMax) {
                return false;
            }

            this.$$data[this.$$positionEnd] = value;
            this.$$positionEnd = (this.$$positionEnd + 1) % this.$$sizeMax;
            this.$$size++;

            this.$$generateNewHash();

            return true;
        };

        Queue.prototype.pushEvenIfFull = function (value) {
            if (this.isFull()) {
                this.pop();
            }
            this.push(value);
        };

        Queue.prototype.pop = function () {
            var result;

            if (this.$$size === 0) {
                return null;
            }
            result = this.$$data[this.$$positionStart];
            this.$$positionStart = (this.$$positionStart + 1) % this.$$sizeMax;
            this.$$size--;

            this.$$generateNewHash();

            return result;
        };

        Queue.prototype.getItem = function (index) {
            if (index >= this.$$size) {
                return null;
            }

            return this.$$data[(this.$$positionStart + index) % this.$$sizeMax];
        };

        Queue.prototype.getSize = function () {
            return this.$$size;
        };

        Queue.prototype.getSizeMax = function () {
            return this.$$sizeMax;
        };

        Queue.prototype.isFull = function () {
            return this.$$size === this.$$sizeMax;
        };

        return Queue;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.AbstractChannelManager', _AbstractChannelManager);

    _AbstractChannelManager.$inject = [
        'Audio.ActiveAudioContext'
    ];

    function _AbstractChannelManager(
        ActiveAudioContext
    ) {
        var AbstractChannelManager;

        AbstractChannelManager = function () {
            this.$$cpuLoadData = {
                blockSampleSize: null,
                blockTime: null,
                blockRealTime: null,
                load: null
            };
        };

        AbstractChannelManager.prototype.getCpuLoadData = function () {
            var c = this.$$cpuLoadData;

            return {
                blockSampleSize: c.blockSampleSize,
                blockTime: c.blockTime,
                blockRealTime: c.blockRealTime,
                load: c.load
            };
        };

        AbstractChannelManager.prototype.$$computeCpuLoadData = function (beginTime, endTime, blockSampleSize) {
            var 
                c = this.$$cpuLoadData,
                blockRealTime, 
                blockTime;

            blockRealTime = endTime - beginTime;
            blockTime = blockSampleSize / ActiveAudioContext.getSampleRate();
            
            c.blockSampleSize = blockSampleSize;
            c.blockTime = blockTime;
            c.blockRealTime = blockRealTime;
            c.load = blockRealTime / blockTime;
        };

        return AbstractChannelManager;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ChannelReceiveBuilder', _ChannelReceiveBuilder);

    _ChannelReceiveBuilder.$inject = [
        'PhysicalLayer.ChannelReceive'
    ];

    function _ChannelReceiveBuilder(
        ChannelReceive
    ) {

        function build(index, configuration) {
            return new ChannelReceive(index, configuration);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.ChannelReceive', _ChannelReceive);

    _ChannelReceive.$inject = [
        'Audio.ActiveAudioContext',
        'Common.CarrierRecoveryBuilder',
        'Common.MathUtil'
    ];

    function _ChannelReceive(
        ActiveAudioContext,                        // TODO remove that depencency - it's here only for sample rate
        CarrierRecoveryBuilder,
        MathUtil
    ) {
        var ChannelReceive;

        ChannelReceive = function (index, configuration) {
            this.$$carrierRecovery = [];
            this.$$carrierFrequency = [];
            this.$$carrierPhaseCorrection = [];
            this.$$notifyInterval = null;
            this.$$notifyHandler = null;
            this.$$index = index;

            this.configure(configuration);
        };

        ChannelReceive.OFDM_INDEX_OUT_OF_RANGE_EXCEPTION = 'OFDM index out of range: ';

        ChannelReceive.prototype.configure = function (configuration) {
            var i, cr, samplePerPeriod, frequency;

            for (i = 0; i < configuration.ofdmSize; i++) {
                frequency = configuration.baseFrequency + i * configuration.ofdmFrequencySpacing;
                samplePerPeriod = ActiveAudioContext.getSampleRate() / frequency;
                cr = CarrierRecoveryBuilder.build(samplePerPeriod, configuration.dftWindowSize);
                this.$$carrierRecovery.push(cr);
                this.$$carrierFrequency.push(frequency);
                this.$$carrierPhaseCorrection.push(0);
            }

            this.$$notifyInterval = configuration.notifyInterval;
            this.$$notifyHandler = configuration.notifyHandler;
        };

        ChannelReceive.prototype.$$checkOfdmIndex = function (ofdmIndex) {
            if (ofdmIndex < 0 || ofdmIndex >= this.$$carrierRecovery.length) {
                throw ChannelReceive.OFDM_INDEX_OUT_OF_RANGE_EXCEPTION + ofdmIndex;
            }
        };

        ChannelReceive.prototype.getOfdmSize = function () {
            return this.$$carrierRecovery.length;
        };

        ChannelReceive.prototype.getRxPhaseCorrection = function (ofdmIndex) {
            this.$$checkOfdmIndex(ofdmIndex);

            return this.$$carrierPhaseCorrection[ofdmIndex];
        };

        ChannelReceive.prototype.getFrequency = function (ofdmIndex) {
            this.$$checkOfdmIndex(ofdmIndex);

            return this.$$carrierFrequency[ofdmIndex];
        };

        ChannelReceive.prototype.setRxPhaseCorrection = function (ofdmIndex, phaseCorrection) {
            this.$$checkOfdmIndex(ofdmIndex);

            this.$$carrierPhaseCorrection[ofdmIndex] = phaseCorrection - MathUtil.floor(phaseCorrection);
        };

        ChannelReceive.prototype.setFrequency = function (ofdmIndex, frequency) {
            var samplePerPeriod;

            this.$$checkOfdmIndex(ofdmIndex);

            samplePerPeriod = ActiveAudioContext.getSampleRate() / frequency;
            this.$$carrierRecovery[ofdmIndex].setSamplePerPeriod(samplePerPeriod);
            this.$$carrierFrequency[ofdmIndex] = frequency;
        };

        ChannelReceive.prototype.handleSample = function (sample, sampleNumberGlobal, blockBeginTime, sampleNumberInBlock) {
            var notifyIteration, cr, cd, i, carrierDetail, sampleTimeOffsetInBlock;

            notifyIteration = (sampleNumberGlobal % this.$$notifyInterval === 0);

            if (notifyIteration) {
                carrierDetail = [];
            }

            for (i = 0; i < this.$$carrierRecovery.length; i++) {
                cr = this.$$carrierRecovery[i];
                cr.handleSample(sample);
                if (notifyIteration) {
                    cd = cr.getCarrierDetail();
                    cd.phase = cd.phase - this.$$carrierPhaseCorrection[i];
                    cd.phase = cd.phase - MathUtil.floor(cd.phase);
                    carrierDetail.push(cd);
                }
            }

            if (notifyIteration) {
                sampleTimeOffsetInBlock = sampleNumberInBlock / ActiveAudioContext.getSampleRate();

                this.$$notifyHandler(
                    this.$$index, 
                    carrierDetail,
                    blockBeginTime + sampleTimeOffsetInBlock
                );
            }
        };

        ChannelReceive.prototype.destroy = function () {
            this.$$carrierRecovery.length = 0;
            this.$$carrierFrequency.length = 0;
            this.$$carrierPhaseCorrection.length = 0;
        };

        return ChannelReceive;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ChannelReceiveManagerBuilder', _ChannelReceiveManagerBuilder);

    _ChannelReceiveManagerBuilder.$inject = [
        'PhysicalLayer.ChannelReceiveManager'
    ];

    function _ChannelReceiveManagerBuilder(
        ChannelReceiveManager
    ) {

        function build(configuration, bufferSize) {
            return new ChannelReceiveManager(configuration, bufferSize);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.ChannelReceiveManager', _ChannelReceiveManager);

    _ChannelReceiveManager.$inject = [
        'PhysicalLayer.AbstractChannelManager',
        'Audio.ActiveAudioContext',
        'PhysicalLayer.ChannelReceiveBuilder'
    ];

    function _ChannelReceiveManager(
        AbstractChannelManager,
        ActiveAudioContext,
        ChannelReceiveBuilder
    ) {
        var ChannelReceiveManager;

        ChannelReceiveManager = function (configuration, bufferSize) {
            AbstractChannelManager.apply(this, arguments);

            this.$$channelReceive = [];
            this.$$scriptNode = null;
            this.$$analyserNode = null;  // empty analyser needs to be connected to script node
            this.$$configuration = configuration;
            this.$$bufferSize = bufferSize;
            this.$$sampleNumberGlobal = 0;

            this.$$init();
        };

        ChannelReceiveManager.prototype = Object.create(AbstractChannelManager.prototype);
        ChannelReceiveManager.prototype.constructor = ChannelReceiveManager;

        ChannelReceiveManager.CHANNEL_INDEX_OUT_OF_RANGE_EXCEPTION = 'Channel index out of range: ';
        ChannelReceiveManager.$$_LOWEST_FFT_SIZE = 256;

        ChannelReceiveManager.prototype.destroy = function () {
            var i, cr;

            for (i = 0; i < this.$$channelReceive.length; i++) {
                cr = this.$$channelReceive[i];
                cr.destroy();
            }
            this.$$channelReceive.length = 0;
        };

        ChannelReceiveManager.prototype.getInputNode = function () {
            return this.$$scriptNode;
        };

        ChannelReceiveManager.prototype.getChannelSize = function () {
            return this.$$channelReceive.length;
        };

        ChannelReceiveManager.prototype.getChannel = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.$$channelReceive.length) {
                throw ChannelReceiveManager.CHANNEL_INDEX_OUT_OF_RANGE_EXCEPTION + channelIndex;
            }

            return this.$$channelReceive[channelIndex];
        };

        ChannelReceiveManager.prototype.getBufferSize = function () {
            return this.$$scriptNode.bufferSize;
        };

        ChannelReceiveManager.prototype.$$init = function () {
            var i, cr;

            this.$$scriptNode = ActiveAudioContext.createScriptProcessor(this.$$bufferSize, 1, 1);
            this.$$scriptNode.onaudioprocess = this.onAudioProcess.bind(this);

            this.$$analyserNode = ActiveAudioContext.createAnalyser();
            this.$$analyserNode.fftSize = ChannelReceiveManager.$$_LOWEST_FFT_SIZE;

            this.$$scriptNode.connect(this.$$analyserNode);

            for (i = 0; i < this.$$configuration.length; i++) {
                cr = ChannelReceiveBuilder.build(i, this.$$configuration[i]);
                this.$$channelReceive.push(cr);
            }
        };

        ChannelReceiveManager.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                inputBuffer = audioProcessingEvent.inputBuffer,
                inputData = inputBuffer.getChannelData(0),
                blockBeginTime = ActiveAudioContext.getCurrentTime(),
                sample, sampleNumberInBlock, j
            ;

            for (sampleNumberInBlock = 0; sampleNumberInBlock < inputBuffer.length; sampleNumberInBlock++) {
                sample = inputData[sampleNumberInBlock];

                for (j = 0; j < this.$$channelReceive.length; j++) {
                    this.$$channelReceive[j].handleSample(
                        sample, 
                        this.$$sampleNumberGlobal,
                        blockBeginTime,
                        sampleNumberInBlock
                    );
                }

                this.$$sampleNumberGlobal++;
            }

            this.$$computeCpuLoadData(blockBeginTime, ActiveAudioContext.getCurrentTime(), inputBuffer.length);
        };

        return ChannelReceiveManager;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ChannelTransmitBuilder', _ChannelTransmitBuilder);

    _ChannelTransmitBuilder.$inject = [
        'PhysicalLayer.ChannelTransmit'
    ];

    function _ChannelTransmitBuilder(
        ChannelTransmit
    ) {

        function build(index, configuration) {
            return new ChannelTransmit(index, configuration);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.ChannelTransmit', _ChannelTransmit);

    _ChannelTransmit.$inject = [
        'Common.MathUtil',
        'Audio.ActiveAudioContext',
        'Common.CarrierGenerateBuilder'
    ];

    function _ChannelTransmit(
        MathUtil,
        ActiveAudioContext,                     // TODO remove that depencency - it's here only for sample rate
        CarrierGenerateBuilder
    ) {
        var ChannelTransmit;

        ChannelTransmit = function (index, configuration) {
            this.$$carrierGenerate = [];
            this.$$carrierFrequency = [];
            this.$$carrierPhaseCorrection = [];
            this.$$index = index;

            this.configure(configuration);
        };

        ChannelTransmit.DATA_LENGTH_DOES_NOT_MATCH_OFDM_SIZE_EXCEPTION = 'Data array length does not match configured OFDM size';
        ChannelTransmit.OFDM_INDEX_OUT_OF_RANGE_EXCEPTION = 'OFDM index out of range: ';

        ChannelTransmit.prototype.addToQueue = function (data) {
            var i;

            if (data.length !== this.$$carrierGenerate.length) {
                throw ChannelTransmit.DATA_LENGTH_DOES_NOT_MATCH_OFDM_SIZE_EXCEPTION;
            }

            for (i = 0; i < this.$$carrierGenerate.length; i++) {
                this.$$carrierGenerate[i].addToQueue(data[i]);
            }
        };

        ChannelTransmit.prototype.getOfdmSize = function () {
            return this.$$carrierGenerate.length;
        };

        ChannelTransmit.prototype.$$checkOfdmIndex = function (ofdmIndex) {
            if (ofdmIndex < 0 || ofdmIndex >= this.$$carrierGenerate.length) {
                throw ChannelTransmit.OFDM_INDEX_OUT_OF_RANGE_EXCEPTION + ofdmIndex;
            }
        };

        ChannelTransmit.prototype.getTxPhaseCorrection = function (ofdmIndex) {
            this.$$checkOfdmIndex(ofdmIndex);

            return this.$$carrierPhaseCorrection[ofdmIndex];
        };

        ChannelTransmit.prototype.getFrequency = function (ofdmIndex) {
            this.$$checkOfdmIndex(ofdmIndex);

            return this.$$carrierFrequency[ofdmIndex];
        };

        ChannelTransmit.prototype.setTxPhaseCorrection = function (ofdmIndex, phaseCorrection) {
            this.$$checkOfdmIndex(ofdmIndex);

            this.$$carrierPhaseCorrection[ofdmIndex] = phaseCorrection - MathUtil.floor(phaseCorrection);
            this.$$carrierGenerate[ofdmIndex].setPhaseCorrection(this.$$carrierPhaseCorrection[ofdmIndex]);
        };

        ChannelTransmit.prototype.setFrequency = function (ofdmIndex, frequency) {
            var samplePerPeriod;

            this.$$checkOfdmIndex(ofdmIndex);

            samplePerPeriod = ActiveAudioContext.getSampleRate() / frequency;
            this.$$carrierGenerate[ofdmIndex].setSamplePerPeriod(samplePerPeriod);
            this.$$carrierFrequency[ofdmIndex] = frequency;
        };

        ChannelTransmit.prototype.configure = function (configuration) {
            var i, cg, samplePerPeriod, frequency;

            for (i = 0; i < configuration.ofdmSize; i++) {
                frequency = configuration.baseFrequency + i * configuration.ofdmFrequencySpacing;
                samplePerPeriod = ActiveAudioContext.getSampleRate() / frequency;
                cg = CarrierGenerateBuilder.build(samplePerPeriod);
                this.$$carrierGenerate.push(cg);
                this.$$carrierFrequency.push(frequency);
                this.$$carrierPhaseCorrection.push(0);
            }
        };

        ChannelTransmit.prototype.getSample = function () {
            var sample, cg, i;

            sample = 0;
            for (i = 0; i < this.$$carrierGenerate.length; i++) {
                cg = this.$$carrierGenerate[i];
                sample += cg.getSample();
                cg.nextSample();
            }

            return sample;
        };

        ChannelTransmit.prototype.destroy = function () {
            this.$$carrierGenerate.length = 0;
            this.$$carrierFrequency.length = 0;
            this.$$carrierPhaseCorrection.length = 0;
        };

        return ChannelTransmit;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ChannelTransmitManagerBuilder', _ChannelTransmitManagerBuilder);

    _ChannelTransmitManagerBuilder.$inject = [
        'PhysicalLayer.ChannelTransmitManager'
    ];

    function _ChannelTransmitManagerBuilder(
        ChannelTransmitManager
    ) {

        function build(configuration, bufferSize) {
            return new ChannelTransmitManager(configuration, bufferSize);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.ChannelTransmitManager', _ChannelTransmitManager);

    _ChannelTransmitManager.$inject = [
        'PhysicalLayer.AbstractChannelManager',
        'Common.MathUtil',
        'Audio.ActiveAudioContext',
        'PhysicalLayer.DefaultConfig',
        'PhysicalLayer.ChannelTransmitBuilder'
    ];

    function _ChannelTransmitManager(
        AbstractChannelManager,
        MathUtil,
        ActiveAudioContext,
        DefaultConfig,
        ChannelTransmitBuilder
    ) {
        var ChannelTransmitManager;

        ChannelTransmitManager = function (configuration, bufferSize) {
            AbstractChannelManager.apply(this, arguments);

            this.$$channelTransmit = [];
            this.$$scriptNode = null;
            this.$$configuration = configuration;
            this.$$bufferSize = bufferSize;
            this.$$fakeNoise = false;

            this.$$init();
        };

        ChannelTransmitManager.prototype = Object.create(AbstractChannelManager.prototype);
        ChannelTransmitManager.prototype.constructor = ChannelTransmitManager;

        ChannelTransmitManager.CHANNEL_INDEX_OUT_OF_RANGE_EXCEPTION = 'Channel index out of range: ';

        ChannelTransmitManager.prototype.destroy = function () {
            var i, ct;

            for (i = 0; i < this.$$channelTransmit.length; i++) {
                ct = this.$$channelTransmit[i];
                ct.destroy();
            }
            this.$$channelTransmit.length = 0;
        };

        ChannelTransmitManager.prototype.getOutputNode = function () {
            return this.$$scriptNode;
        };

        ChannelTransmitManager.prototype.getChannelSize = function () {
            return this.$$channelTransmit.length;
        };

        ChannelTransmitManager.prototype.getChannel = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.$$channelTransmit.length) {
                throw ChannelTransmitManager.CHANNEL_INDEX_OUT_OF_RANGE_EXCEPTION + channelIndex;
            }

            return this.$$channelTransmit[channelIndex];
        };

        ChannelTransmitManager.prototype.getBufferSize = function () {
            return this.$$scriptNode.bufferSize;
        };

        ChannelTransmitManager.prototype.$$init = function () {
            var i, ct;

            this.$$scriptNode = ActiveAudioContext.createScriptProcessor(this.$$bufferSize, 1, 1);
            this.$$scriptNode.onaudioprocess = this.onAudioProcess.bind(this);

            for (i = 0; i < this.$$configuration.length; i++) {
                ct = ChannelTransmitBuilder.build(i, this.$$configuration[i]);
                this.$$channelTransmit.push(ct);
            }
        };

        ChannelTransmitManager.prototype.enableFakeNoise = function () {
            this.$$fakeNoise = true;
        };

        ChannelTransmitManager.prototype.disableFakeNoise = function () {
            this.$$fakeNoise = false;
        };

        ChannelTransmitManager.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                outputBuffer = audioProcessingEvent.outputBuffer,
                outputData = outputBuffer.getChannelData(0),
                blockBeginTime = ActiveAudioContext.getCurrentTime(),
                sample, i, j
            ;

            for (i = 0; i < outputBuffer.length; i++) {
                sample = 0;
                for (j = 0; j < this.$$channelTransmit.length; j++) {
                    sample += this.$$channelTransmit[j].getSample();
                }

                if (this.$$fakeNoise) {
                    sample += ((MathUtil.random() * 2) - 1) * DefaultConfig.FAKE_NOISE_MAX_AMPLITUDE;
                }

                outputData[i] = sample;
            }

            this.$$computeCpuLoadData(blockBeginTime, ActiveAudioContext.getCurrentTime(), outputBuffer.length);
        };

        return ChannelTransmitManager;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.RxHandlerBuilder', _RxHandlerBuilder);

    _RxHandlerBuilder.$inject = [
        'PhysicalLayer.RxHandler'
    ];

    function _RxHandlerBuilder(
        RxHandler
    ) {

        function build(rxConstellationDiagram, rxExternalHandler) {
            return new RxHandler(rxConstellationDiagram, rxExternalHandler);
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.RxHandler', _RxHandler);

    _RxHandler.$inject = [
        'PhysicalLayer.DefaultConfig',
        'Audio.ActiveAudioContext',
        'Common.MathUtil'
    ];

    function _RxHandler(
        DefaultConfig,
        ActiveAudioContext,
        MathUtil
    ) {
        var RxHandler;

        RxHandler = function (rxConstellationDiagram, rxExternalHandler) {
            this.$$delayedData = [];
            this.$$rxConstellationDiagram = rxConstellationDiagram;
            this.$$rxExternalHandler = rxExternalHandler;
            this.$$intervalId = setInterval(this.$$intervalHandler.bind(this), RxHandler.$$_DELAY_LOOP_RESOLUTION);
        };

        RxHandler.$$_RX_EXTRA_DELAY = 0.05;        // [sec]
        RxHandler.$$_DELAY_LOOP_RESOLUTION = 8;    // [ms]

        RxHandler.prototype.$$intervalHandler = function () {
            var
                currentTime = ActiveAudioContext.getCurrentTime(),
                removedCount = 0,
                item, i
            ;

            for (i = 0; i < this.$$delayedData.length; i++) {
                item = this.$$delayedData[i];

                if (item.time < (currentTime - RxHandler.$$_RX_EXTRA_DELAY)) {
                    this.$$handle(
                        item.channelIndex,
                        item.carrierDetail,
                        item.time
                    );
                    removedCount++;
                } else {
                    break;
                }
            }

            /*
            // TODO enable if needed
            if (console && removedCount > 1) {
                console.log('Delay loop warning - processed more than one rx item: ' + removedCount);
            }
            */

            if (removedCount > 0) {
                this.$$delayedData.splice(0, removedCount);
            }
        };

        RxHandler.prototype.handle = function (channelIndex, carrierDetail, time) {
            this.$$delayedData.push({
                channelIndex: channelIndex,
                carrierDetail: carrierDetail,
                time: time
            });
        };

        RxHandler.prototype.$$handle = function (channelIndex, carrierDetail, time) {
            var i, cd, queue;

            for (i = 0; i < carrierDetail.length; i++) {
                cd = carrierDetail[i];
                if (cd.powerDecibel === -Infinity) {
                    cd.powerDecibel = DefaultConfig.MINIMUM_POWER_DECIBEL;
                }
                cd.powerDecibel = cd.powerDecibel < DefaultConfig.MINIMUM_POWER_DECIBEL ? DefaultConfig.MINIMUM_POWER_DECIBEL : cd.powerDecibel;

                if (this.$$rxConstellationDiagram.length === 0) {
                    continue;
                }

                queue = this.$$rxConstellationDiagram[channelIndex].queue[i];
                queue.pushEvenIfFull({
                    powerDecibel: cd.powerDecibel,
                    phase: cd.phase
                });
            }

            if (this.$$rxExternalHandler.callback) {
                this.$$rxExternalHandler.callback(channelIndex, carrierDetail, ActiveAudioContext.getCurrentTime());
            }
        };

        RxHandler.prototype.destroy = function () {
            clearInterval(this.$$intervalId);
        };

        return RxHandler;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.GuardPowerCollectorBuilder', _GuardPowerCollectorBuilder);

    _GuardPowerCollectorBuilder.$inject = [
        'PhysicalLayerAdapter.GuardPowerCollector'
    ];

    function _GuardPowerCollectorBuilder(
        GuardPowerCollector
    ) {

        function build() {
            return new GuardPowerCollector();
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerAdapter.GuardPowerCollector', _GuardPowerCollector);

    _GuardPowerCollector.$inject = [
        'Common.AbstractValueCollector',
        'Common.MathUtil'
    ];

    function _GuardPowerCollector(
        AbstractValueCollector,
        MathUtil
    ) {
        var GuardPowerCollector;

        GuardPowerCollector = function () {
            AbstractValueCollector.apply(this, arguments);
        };

        GuardPowerCollector.prototype = Object.create(AbstractValueCollector.prototype);
        GuardPowerCollector.prototype.constructor = GuardPowerCollector;

        GuardPowerCollector.EMPTY_LIST_EXCEPTION = 'Cannot finalize GuardPowerCollector without any samples collected';

        GuardPowerCollector.prototype.$$finalize = function () {
            if (this.$$valueList.length === 0) {
                throw GuardPowerCollector.EMPTY_LIST_EXCEPTION;
            }
            
            return MathUtil.minInArray(this.$$valueList);
        };

        return GuardPowerCollector;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.PhaseOffsetCollectorBuilder', _PhaseOffsetCollectorBuilder);

    _PhaseOffsetCollectorBuilder.$inject = [
        'PhysicalLayerAdapter.PhaseOffsetCollector'
    ];

    function _PhaseOffsetCollectorBuilder(
        PhaseOffsetCollector
    ) {

        function build() {
            return new PhaseOffsetCollector();
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerAdapter.PhaseOffsetCollector', _PhaseOffsetCollector);

    _PhaseOffsetCollector.$inject = [
        'Common.AbstractValueCollector',
        'Common.MathUtil'
    ];

    function _PhaseOffsetCollector(
        AbstractValueCollector,
        MathUtil
    ) {
        var PhaseOffsetCollector;

        PhaseOffsetCollector = function () {
            AbstractValueCollector.apply(this, arguments);
        };

        PhaseOffsetCollector.prototype = Object.create(AbstractValueCollector.prototype);
        PhaseOffsetCollector.prototype.constructor = PhaseOffsetCollector;

        PhaseOffsetCollector.prototype.$$finalize = function () {
            var
                i, indexA, indexB, drift,
                str = '';

            if (this.$$valueList.length === 0) {
                return null;
            }

            // TODO rewrite this temporary code
            for (i = 0; i < this.$$valueList.length; i++) {
                str += (
                    (MathUtil.round(this.$$valueList[i].time * 1000) / 1000) + ' ' +
                    (MathUtil.round(this.$$valueList[i].phase * 1000) / 1000) + ' | '
                );
            }

            indexA = MathUtil.round(0.43 * this.$$valueList.length);
            indexB = MathUtil.round(0.57 * this.$$valueList.length);
            indexB = indexB >= this.$$valueList.length ? this.$$valueList.length - 1 : indexB;
            drift = 0;
            if (indexA !== indexB && indexA < indexB) {
                console.log('phase history indexA', this.$$valueList[indexA].time, this.$$valueList[indexA].phase);
                console.log('phase history indexB', this.$$valueList[indexB].time, this.$$valueList[indexB].phase);
                drift = -(this.$$valueList[indexB].phase - this.$$valueList[indexA].phase) / (this.$$valueList[indexB].time - this.$$valueList[indexA].time);
                console.log('phase history drift', drift);
            }

            return drift;
        };

        PhaseOffsetCollector.prototype.collect = function (value) {
            // TODO rewrite this temporary code
            this.$$valueList.push({
                time: value.stateDurationTime,
                phase: value.carrierDetail[0].phase      // TODO pass all ofdm phases here !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            });                                          // TODO check also powerThreshold to avoid fine-tune on null OFDMs
        };

        return PhaseOffsetCollector;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.RxStateMachineBuilder', _RxStateMachineBuilder);

    _RxStateMachineBuilder.$inject = [
        'PhysicalLayerAdapter.RxStateMachine'
    ];

    function _RxStateMachineBuilder(
        RxStateMachine
    ) {

        function build(handlerIdleInit, handlerFirstSyncWait, handlerFirstSync, handlerFatalError, handlerIdle, handlerSymbol, handlerSync, handlerGuard, handlerError) {
            return new RxStateMachine(
                handlerIdleInit,
                handlerFirstSyncWait,
                handlerFirstSync,
                handlerFatalError,
                handlerIdle,
                handlerSymbol,
                handlerSync,
                handlerGuard,
                handlerError
            );
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerAdapter.RxStateMachine', _RxStateMachine);

    _RxStateMachine.$inject = [
        'PhysicalLayerAdapter.ReceiveAdapterState'
    ];

    function _RxStateMachine(
        ReceiveAdapterState
    ) {
        var RxStateMachine;

        RxStateMachine = function (handlerIdleInit, handlerFirstSyncWait, handlerFirstSync, handlerFatalError, handlerIdle, handlerSymbol, handlerSync, handlerGuard, handlerError) {
            this.$$stateHandler = {};
            this.$$stateHandler[ReceiveAdapterState.IDLE_INIT] = handlerIdleInit;
            this.$$stateHandler[ReceiveAdapterState.FIRST_SYNC_WAIT] = handlerFirstSyncWait;
            this.$$stateHandler[ReceiveAdapterState.FIRST_SYNC] = handlerFirstSync;
            this.$$stateHandler[ReceiveAdapterState.FATAL_ERROR] = handlerFatalError;
            this.$$stateHandler[ReceiveAdapterState.IDLE] = handlerIdle;
            this.$$stateHandler[ReceiveAdapterState.SYMBOL] = handlerSymbol;
            this.$$stateHandler[ReceiveAdapterState.SYNC] = handlerSync;
            this.$$stateHandler[ReceiveAdapterState.GUARD] = handlerGuard;
            this.$$stateHandler[ReceiveAdapterState.ERROR] = handlerError;
            this.$$symbolStateMaxDurationTime = null;
            this.$$guardStateMaxDurationTime = null;
            this.$$syncStateMaxDurationTime = null;

            this.$$state = null;
            this.$$stateDurationTime = null;
            this.$$stateBeginTime = null;
            this.$$resetFlag = true;
        };

        RxStateMachine.SET_ALL_MAX_DURATION_TIMES_FIRST_EXCEPTION = 'Please set all max duration times first';

        RxStateMachine.prototype.scheduleReset = function () {
            this.$$resetFlag = true;
        };

        RxStateMachine.prototype.$$changeState = function (newState, time) {
            if (newState !== null) {
                this.$$state = newState;
                this.$$stateBeginTime = time;
            } else {
                this.$$stateDurationTime = time - this.$$stateBeginTime;
            }
        };

        RxStateMachine.prototype.$$handlerIdleInit = function (pilotSignalPresent, time) {
            var newState;

            this.$$changeState(null, time);

            // run external handler
            newState = this.$$stateHandler[ReceiveAdapterState.IDLE_INIT](this.$$stateDurationTime);

            if (newState) {
                this.$$changeState(newState, time);
                return false;
            }

            return true;
        };

        RxStateMachine.prototype.$$handlerFirstSyncWait = function (pilotSignalPresent, time) {
            if (pilotSignalPresent) {
                this.$$changeState(ReceiveAdapterState.FIRST_SYNC, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[ReceiveAdapterState.FIRST_SYNC_WAIT](this.$$stateDurationTime);
            }

            return true;
        };

        RxStateMachine.prototype.$$handlerFirstSync = function (pilotSignalPresent, time) {
            var newState;

            this.$$changeState(null, time);

            // run external handler
            newState = this.$$stateHandler[ReceiveAdapterState.FIRST_SYNC](this.$$stateDurationTime);

            if (newState) {
                this.$$changeState(newState, time);
                return false;
            }

            return true;
        };

        RxStateMachine.prototype.$$handlerFatalError = function (pilotSignalPresent, time) {
            var newState;

            this.$$changeState(null, time);

            // run external handler
            newState = this.$$stateHandler[ReceiveAdapterState.FATAL_ERROR](this.$$stateDurationTime);

            if (newState) {
                this.$$changeState(newState, time);
                return false;
            }

            return true;
        };

        RxStateMachine.prototype.$$handlerIdle = function (pilotSignalPresent, time) {
            if (pilotSignalPresent) {
                this.$$changeState(ReceiveAdapterState.SYMBOL, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[ReceiveAdapterState.IDLE](this.$$stateDurationTime);
            }

            return true;
        };

        RxStateMachine.prototype.$$handlerSymbol = function (pilotSignalPresent, time) {
            if (!pilotSignalPresent) {
                this.$$changeState(ReceiveAdapterState.GUARD, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[ReceiveAdapterState.SYMBOL](this.$$stateDurationTime);

                if (this.$$stateDurationTime > this.$$symbolStateMaxDurationTime) {
                    this.$$changeState(ReceiveAdapterState.SYNC, time);
                    return false;
                }
            }

            return true;
        };

        RxStateMachine.prototype.$$handlerSync = function (pilotSignalPresent, time) {
            if (!pilotSignalPresent) {
                this.$$changeState(ReceiveAdapterState.IDLE, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[ReceiveAdapterState.SYNC](this.$$stateDurationTime);

                if (this.$$stateDurationTime > this.$$syncStateMaxDurationTime) {
                    this.$$changeState(ReceiveAdapterState.ERROR, time);
                    return false;
                }
            }

            return true;
        };

        RxStateMachine.prototype.$$handlerGuard = function (pilotSignalPresent, time) {
            if (pilotSignalPresent) {
                this.$$changeState(ReceiveAdapterState.SYMBOL, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[ReceiveAdapterState.GUARD](this.$$stateDurationTime);
                
                if (this.$$stateDurationTime > this.$$guardStateMaxDurationTime) {
                    this.$$changeState(ReceiveAdapterState.IDLE, time);
                    return false;
                }
            }

            return true;
        };

        RxStateMachine.prototype.$$handlerError = function (pilotSignalPresent, time) {
            if (!pilotSignalPresent) {
                this.$$changeState(ReceiveAdapterState.IDLE, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[ReceiveAdapterState.ERROR](this.$$stateDurationTime);
            }

            return true;
        };

        RxStateMachine.prototype.setGuardStateMaxDurationTime = function (time) {
            this.$$guardStateMaxDurationTime = time;
        };

        RxStateMachine.prototype.setSymbolStateMaxDurationTime = function (time) {
            this.$$symbolStateMaxDurationTime = time;
        };

        RxStateMachine.prototype.setSyncStateMaxDurationTime = function (time) {
            this.$$syncStateMaxDurationTime = time;
        };

        RxStateMachine.prototype.getState = function (pilotSignalPresent, time) {
            var
                S = ReceiveAdapterState,
                finished
            ;

            if (this.$$resetFlag) {
                this.$$changeState(S.IDLE_INIT, time);
                this.$$resetFlag = false;
            }

            if (
                this.$$guardStateMaxDurationTime === null ||
                this.$$symbolStateMaxDurationTime === null ||
                this.$$syncStateMaxDurationTime === null
            ) {
                throw RxStateMachine.SET_ALL_MAX_DURATION_TIMES_FIRST_EXCEPTION;
            }

            while (true) {
                switch (this.$$state) {
                    case S.IDLE_INIT:
                        finished = this.$$handlerIdleInit(pilotSignalPresent, time);
                        break;
                    case S.FIRST_SYNC_WAIT:
                        finished = this.$$handlerFirstSyncWait(pilotSignalPresent, time);
                        break;
                    case S.FIRST_SYNC:
                        finished = this.$$handlerFirstSync(pilotSignalPresent, time);
                        break;
                    case S.FATAL_ERROR:
                        finished = this.$$handlerFatalError(pilotSignalPresent, time);
                        break;
                    case S.IDLE:
                        finished = this.$$handlerIdle(pilotSignalPresent, time);
                        break;
                    case S.SYMBOL:
                        finished = this.$$handlerSymbol(pilotSignalPresent, time);
                        break;
                    case S.SYNC:
                        finished = this.$$handlerSync(pilotSignalPresent, time);
                        break;
                    case S.GUARD:
                        finished = this.$$handlerGuard(pilotSignalPresent, time);
                        break;
                    case S.ERROR:
                        finished = this.$$handlerError(pilotSignalPresent, time);
                        break;
                }

                if (finished) {
                    break;
                }
            }
            return this.$$state;
        };

        return RxStateMachine;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.Util', _Util);

    _Util.$inject = [
        'Common.MathUtil'
    ];

    function _Util(
        MathUtil
    ) {

        function valueOrDefault(value, defaultValue) {
            return typeof value !== 'undefined' ? value : defaultValue;
        }

        function accessor(element, path) {
            var
                pathList = path.split('.'),
                result = element,
                i
            ;

            if (!element) {
                return undefined;
            }

            for (i = 0; i < pathList.length; i++) {
                result = result[pathList[i]];
                if (!result) {
                    break;
                }
            }

            return result;
        }

        function computeAverage(list) {
            var i, sum;

            if (!list || list.length === 0) {
                return 0;
            }
            sum = 0;
            for (i = 0; i < list.length; i++) {
                sum += list[i];
            }

            return sum / list.length;
        }

        function convertToDecibel(value) {
            return 10 * MathUtil.log(value) / MathUtil.LN10; // TODO it should be (20 * ...) because decibels describes power levels
        }

        function findUnitAngle(x, y) {
            var length, quarter, angle;

            length = MathUtil.sqrt(x * x + y * y);
            length = (length < 0.000001) ? 0.000001 : length;    // prevents from dividing by zero
            quarter = (x >= 0) ? (y >= 0 ? 0 : 1) : (y < 0 ? 2 : 3);
            switch (quarter) {
                case 0:
                    angle = MathUtil.asin(x / length);
                    break;
                case 1:
                    angle = MathUtil.asin(-y / length) + MathUtil.HALF_PI;
                    break;
                case 2:
                    angle = MathUtil.asin(-x / length) + MathUtil.PI;
                    break;
                case 3:
                    angle = MathUtil.asin(y / length) + 1.5 * MathUtil.PI;
                    break;
            }

            return angle / MathUtil.TWO_PI;
        }

        function unitFade(x) {
            x  = x < 0 ? 0 : x;
            x  = x > 1 ? 1 : x;

            return 0.5 * (MathUtil.sin((x - 0.5) * MathUtil.PI) + 1);
        }

        function queueAdd(queue, item, copyCallback, amountFieldName) {
            var queueItem;

            amountFieldName = amountFieldName === undefined ? 'duration' : amountFieldName;
            if (item[amountFieldName] > 0) {
                queueItem = {};
                queueItem[amountFieldName] = item[amountFieldName];
                copyCallback(queueItem, item);
                queue.push(queueItem);
            }
        }

        function queuePop(queue, amountFieldName) {
            var queueItem;

            amountFieldName = amountFieldName === undefined ? 'duration' : amountFieldName;

            if (queue.length === 0) {
                return null;
            }

            queue[0][amountFieldName]--;
            queueItem = queue[0];
            if (queue[0][amountFieldName] === 0) {
                // TODO check performance, maybe it's better to just keep track
                // of used elements and delete array at the end
                 queue.splice(0, 1);
            }

            return queueItem;
        }

        function findMaxValueIndex(list, accessorString) {
            var
                maxValue = null,
                index = null,
                i, value
            ;

            if (!list) {
                return null;
            }

            for (i = 0; i < list.length; i++) {
                value = accessor(list[i], accessorString);
                if (index === null || value > maxValue) {
                    maxValue = value;
                    index = i;
                }
            }

            return index;
        }

        return {
            valueOrDefault: valueOrDefault,
            accessor: accessor,
            computeAverage: computeAverage,
            convertToDecibel: convertToDecibel,
            findUnitAngle: findUnitAngle,
            unitFade: unitFade,
            queueAdd: queueAdd,
            queuePop: queuePop,
            findMaxValueIndex: findMaxValueIndex
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.RxStateMachineManagerBuilder', _RxStateMachineManagerBuilder);

    _RxStateMachineManagerBuilder.$inject = [
        'PhysicalLayerAdapter.RxStateMachineManager'
    ];

    function _RxStateMachineManagerBuilder(
        RxStateMachineManager
    ) {

        function build(channelIndex, packetReceiveHandler, frequencyUpdateHandler, phaseCorrectionUpdateHandler) {
            return new RxStateMachineManager(
                channelIndex,
                packetReceiveHandler, 
                frequencyUpdateHandler, 
                phaseCorrectionUpdateHandler
            );
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerAdapter.RxStateMachineManager', _RxStateMachineManager);

    _RxStateMachineManager.$inject = [
        'Common.MathUtil',
        'Common.Util',
        'Common.AverageValueCollectorBuilder',
        'PhysicalLayer.DefaultConfig',
        'PhysicalLayerAdapter.SignalPowerCollectorBuilder',
        'PhysicalLayerAdapter.GuardPowerCollectorBuilder',
        'PhysicalLayerAdapter.PhaseOffsetCollectorBuilder',
        'PhysicalLayerAdapter.RxStateMachineBuilder',
        'PhysicalLayerAdapter.ReceiveAdapterState'
    ];

    function _RxStateMachineManager(
        MathUtil,
        Util,
        AverageValueCollectorBuilder,
        DefaultConfig,
        SignalPowerCollectorBuilder,
        GuardPowerCollectorBuilder,
        PhaseOffsetCollectorBuilder,
        RxStateMachineBuilder,
        ReceiveAdapterState
    ) {
        var RxStateMachineManager;

        RxStateMachineManager = function (channelIndex, packetReceiveHandler, frequencyUpdateHandler, phaseCorrectionUpdateHandler) {
            this.$$channelIndex = channelIndex;

            this.$$packetReceiveHandler = packetReceiveHandler;
            this.$$frequencyUpdateHandler = frequencyUpdateHandler;
            this.$$phaseCorrectionUpdateHandler = phaseCorrectionUpdateHandler;

            this.$$stateMachine = RxStateMachineBuilder.build(
                this.$$handlerIdleInit.bind(this),
                this.$$handlerFirstSyncWait.bind(this),
                this.$$handlerFirstSync.bind(this),
                this.$$handlerFatalError.bind(this),
                this.$$handlerIdle.bind(this),
                this.$$handlerSymbol.bind(this),
                this.$$handlerSync.bind(this),
                this.$$handlerGuard.bind(this),
                this.$$handlerError.bind(this)
            );

            this.$$sampleCollectionTimeIdleInitState = null;
            this.$$sampleCollectionTimeFirstSyncState = null;
            this.$$syncPreamble = null;
            this.$$pskSize = null;

            this.$$averageIdlePowerCollector = AverageValueCollectorBuilder.build();
            this.$$averageFirstSyncPowerCollector = AverageValueCollectorBuilder.build();
            this.$$signalPowerCollector = SignalPowerCollectorBuilder.build();
            this.$$guardPowerCollector = GuardPowerCollectorBuilder.build();
            this.$$phaseOffsetCollector = PhaseOffsetCollectorBuilder.build();

            this.$$resetInternal();
        };

        RxStateMachineManager.$$_INITIAL_POWER_THRESHOLD = 0;      // after init we need to listen to noise so this threshold should prevent catching all possible signals
        RxStateMachineManager.$$_DECIBLES_ABOVE_AVERAGE_IDLE = 10; // decibels above average idle power (ambient noise) in order to catch first, even weak, signal - it means that you should keep this value low
        RxStateMachineManager.$$_OFDM_PILOT_SIGNAL_INDEX = 0;
        RxStateMachineManager.$$_AVERAGE_POWER_UNIT_FACTOR = 0.5;  // 0.0 -> closer to average 'idle' power, 1.0 -> closer to average 'first sync' power

        RxStateMachineManager.prototype.$$resetInternal = function () {
            this.$$averageIdlePowerCollector.clearAll();
            this.$$averageFirstSyncPowerCollector.clearAll();
            this.$$signalPowerCollector.clearAll();
            this.$$guardPowerCollector.clearAll();
            this.$$phaseOffsetCollector.clearAll();

            this.$$powerThreshold = RxStateMachineManager.$$_INITIAL_POWER_THRESHOLD;

            this.$$currentData = null;
            this.$$dataPacket = [];
            this.$$dataSymbol = [];
        };

        RxStateMachineManager.prototype.reset = function () {
            this.$$resetInternal();
            this.$$stateMachine.scheduleReset();
        };

        RxStateMachineManager.prototype.setSymbolStateMaxDurationTime = function (value) {
            this.$$stateMachine.setSymbolStateMaxDurationTime(value);
        };

        RxStateMachineManager.prototype.setGuardStateMaxDurationTime  = function (value) {
            this.$$stateMachine.setGuardStateMaxDurationTime(value);
        };

        RxStateMachineManager.prototype.setSyncStateMaxDurationTime = function (value) {
            this.$$stateMachine.setSyncStateMaxDurationTime(value);
        };

        RxStateMachineManager.prototype.setSampleCollectionTimeIdleInitState = function (value) {
            this.$$sampleCollectionTimeIdleInitState = value;
        };

        RxStateMachineManager.prototype.setSampleCollectionTimeFirstSyncState = function (value) {
            this.$$sampleCollectionTimeFirstSyncState = value;
        };

        RxStateMachineManager.prototype.setSyncPreamble  = function (value) {
            this.$$syncPreamble = value;
        };

        RxStateMachineManager.prototype.setPskSize  = function (value) {
            this.$$pskSize = value;
        };

        RxStateMachineManager.prototype.$$handlerIdleInit = function (stateDurationTime) {
            var
                powerDecibel = this.$$currentData.pilotSignal.powerDecibel,
                handlerResult = null
            ;

            if (stateDurationTime < this.$$sampleCollectionTimeIdleInitState) {
                this.$$averageIdlePowerCollector.collect(powerDecibel);
            } else {
                try {
                    // put first power threshold slightly above collected noise power to detect even weak signals
                    this.$$powerThreshold = this.$$averageIdlePowerCollector.finalize() + RxStateMachineManager.$$_DECIBLES_ABOVE_AVERAGE_IDLE;
                    handlerResult = ReceiveAdapterState.FIRST_SYNC_WAIT;
                } catch (e) {
                    handlerResult = ReceiveAdapterState.FATAL_ERROR;
                }
            }

            return handlerResult;
        };

        RxStateMachineManager.prototype.$$handlerFirstSyncWait = function (stateDurationTime) {
            // nothing much here - user needs to send 'Sync' signal on the other device, we can just wait...
            return null;
        };

        RxStateMachineManager.prototype.$$handlerFirstSync = function (stateDurationTime) {
            var 
                powerDecibel = this.$$currentData.pilotSignal.powerDecibel,
                averageFirstSyncPower, averageIdlePower, powerDifference
            ;

            // TODO refactor code block order - condition below happens actually at FIRST_SYNC state end
            if (this.$$averageFirstSyncPowerCollector.getLastFinalizedResult()) {
                // wait until signal will drop below threshold
                if (powerDecibel < this.$$powerThreshold) {
                    return ReceiveAdapterState.IDLE;
                } else {
                    return null;
                }
            }

            // signal cannot be weaker than previously stored average idle noise... :)
            if (powerDecibel <= this.$$averageIdlePowerCollector.getLastFinalizedResult()) {
                return ReceiveAdapterState.FATAL_ERROR;
            }
            
            if (stateDurationTime < this.$$sampleCollectionTimeFirstSyncState) {
                // collect phase history for all OFDM subcarriers - it will be later used for fine-tune frequency offsets
                this.$$phaseOffsetCollector.collect({
                    stateDurationTime: stateDurationTime,
                    carrierDetail: this.$$currentData.carrierDetail
                });

                // collect desired signal power history and later compute average signal power and power threshold
                this.$$averageFirstSyncPowerCollector.collect(powerDecibel);
            } else {
                try {
                    averageFirstSyncPower = this.$$averageFirstSyncPowerCollector.finalize();    // this line may trow error
                    averageIdlePower = this.$$averageIdlePowerCollector.getLastFinalizedResult();
                    powerDifference = averageFirstSyncPower - averageIdlePower;

                    // put threshold somewhere (depending on unit factor) between average idle power and average first sync power
                    this.$$powerThreshold = averageIdlePower + RxStateMachineManager.$$_AVERAGE_POWER_UNIT_FACTOR * powerDifference;
                } catch (e) {
                    return ReceiveAdapterState.FATAL_ERROR;
                }
            }
        };

        RxStateMachineManager.prototype.$$handlerFatalError = function (stateDurationTime) {
            // nothing much here - only way to escape from this state is to reset Receive Adapter
        };
        
        RxStateMachineManager.prototype.$$handlerIdle = function (stateDurationTime) {
            // share collected packet with rest of the world
            if (this.$$dataPacket.length > 0) {
                this.$$packetReceiveHandler(this.$$channelIndex, this.$$preparePacket(this.$$dataPacket));
                this.$$dataPacket.length = 0;
            }

            // fine-tune frequency offsets basing on phase history if any
            if (this.$$phaseOffsetCollector.hasAtLeastItem()) {
                this.$$frequencyUpdateHandler(this.$$channelIndex, this.$$phaseOffsetCollector.finalize());
            }

            // clear collected guard history from last 'GUARD' state because it was followed
            // directly by IDLE state so technically it wasn't GUARD state at all
            this.$$guardPowerCollector.clearList();
        };

        RxStateMachineManager.prototype.$$handlerSymbol = function (stateDurationTime) {
            var powerDecibel = this.$$currentData.pilotSignal.powerDecibel;

            // code below stores information about quality of incoming packets in the real time
            this.$$signalPowerCollector.collect(powerDecibel);
            if (this.$$guardPowerCollector.hasAtLeastItem()) {
                this.$$guardPowerCollector.finalize();
            }
        
            // add current signal sample to list
            this.$$dataSymbol.push(this.$$currentData);
        };

        RxStateMachineManager.prototype.$$handlerSync = function (stateDurationTime) {
            // collect phase history for all OFDM subcarriers - it will be later used for fine-tune frequency offsets
            this.$$phaseOffsetCollector.collect({
                stateDurationTime: stateDurationTime,
                carrierDetail: this.$$currentData.carrierDetail
            });
        };

        RxStateMachineManager.prototype.$$handlerGuard = function (stateDurationTime) {
            var
                powerDecibel = this.$$currentData.pilotSignal.powerDecibel,
                bestQualityIndex
            ;

            // code below stores information about quality of incoming packets in the real time
            this.$$guardPowerCollector.collect(powerDecibel);
            if (this.$$signalPowerCollector.hasAtLeastItem()) {
                this.$$signalPowerCollector.finalize();
            }

            // find best signal sample and add to current packet
            if (this.$$dataSymbol.length > 0) {
                bestQualityIndex = Util.findMaxValueIndex(this.$$dataSymbol, 'pilotSignal.powerDecibel');
                this.$$dataPacket.push(
                    this.$$dataSymbol[bestQualityIndex].carrierDetail
                );
                if (this.$$isCurrentSymbolSyncPreamble()) {
                    this.$$phaseCorrectionUpdateHandler(this.$$channelIndex, this.$$dataSymbol[bestQualityIndex].carrierDetail);
                }
                this.$$dataSymbol = [];
            }
        };

        RxStateMachineManager.prototype.$$handlerError = function (stateDurationTime) {
            // nothing much here - this state will automatically transit to idle when pilot signal will be gone
        };

        RxStateMachineManager.prototype.$$preparePacket = function (dataPacket) {
            var i, j, result, ofdmList, carrierDetail;

            result = [];
            for (i = 0; i < dataPacket.length; i++) {
                if (i === 0 && this.$$syncPreamble) {
                    // when syncPreamble is true then first burst is used only for phase
                    // alignment - we can simply omit it in the final packet
                    continue;
                }
                carrierDetail = dataPacket[i];
                ofdmList = [];
                for (j = 0; j < carrierDetail.length; j++) {
                    ofdmList.push(
                        MathUtil.round(carrierDetail[j].phase * this.$$pskSize) % this.$$pskSize
                    );
                }
                result.push(ofdmList);
            }

            return result;
        };

        RxStateMachineManager.prototype.$$isCurrentSymbolSyncPreamble = function () {
            return this.$$syncPreamble && this.$$dataPacket.length === 1;
        };

        RxStateMachineManager.prototype.$$isInputReallyConnected = function () {
            return this.$$currentData.pilotSignal.powerDecibel !== DefaultConfig.MINIMUM_POWER_DECIBEL;
        };

        RxStateMachineManager.prototype.$$isPilotSignalPresent = function () {
            return this.$$currentData.pilotSignal.powerDecibel > this.$$powerThreshold;
        };

        RxStateMachineManager.prototype.receive = function (carrierDetail, time) {
            var state;

            // grab current data, this will be available at all handlers that will be called back by $$stateMachine
            this.$$currentData = {
                pilotSignal: carrierDetail[RxStateMachineManager.$$_OFDM_PILOT_SIGNAL_INDEX],  // alias for pilot
                carrierDetail: carrierDetail
            };

            if (this.$$isInputReallyConnected()) {
                state = this.$$stateMachine.getState(this.$$isPilotSignalPresent(), time);
            } else {
                state = ReceiveAdapterState.NO_INPUT;
                this.reset();
            }

            return {
                state: state,
                // TODO clean that mess below, move data to some dedicated fields in return object
                power: (
                    '<br/>' +
                    'averageIdlePower: ' + MathUtil.round(this.$$averageIdlePowerCollector.getLastFinalizedResult() * 100) / 100 + '<br/>' +
                    'averageFirstSyncPower: ' + MathUtil.round(this.$$averageFirstSyncPowerCollector.getLastFinalizedResult() * 100) / 100 + ' <br/>' +
                    '&nbsp;&nbsp;&nbsp;delta: ' + MathUtil.round((this.$$averageFirstSyncPowerCollector.getLastFinalizedResult() - this.$$averageIdlePowerCollector.getLastFinalizedResult()) * 100) / 100 + ' <br/>' +
                    '&nbsp;&nbsp;&nbsp;powerThreshold: ' + MathUtil.round(this.$$powerThreshold * 100) / 100 + ' <br/>' +
                    'minGuardPower: ' + MathUtil.round(this.$$guardPowerCollector.getLastFinalizedResult() * 100) / 100 + ' sampleSize: ' + this.$$guardPowerCollector.getLastFinalizedSize() + '<br/>' +
                    'maxSignalPower: ' + MathUtil.round(this.$$signalPowerCollector.getLastFinalizedResult() * 100) / 100 + ' sampleSize: ' + this.$$signalPowerCollector.getLastFinalizedSize() + '<br/>' +
                    '&nbsp;&nbsp;&nbsp;delta: ' + MathUtil.round((this.$$signalPowerCollector.getLastFinalizedResult() - this.$$guardPowerCollector.getLastFinalizedResult()) * 100) / 100 + ' <br/>' +
                    '&nbsp;&nbsp;&nbsp;idealPowerThreshold: ' + MathUtil.round(0.5 * (this.$$signalPowerCollector.getLastFinalizedResult() + this.$$guardPowerCollector.getLastFinalizedResult()) * 100) / 100 + ' <br/>'
                )
            };
        };

        return RxStateMachineManager;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.SignalPowerCollectorBuilder', _SignalPowerCollectorBuilder);

    _SignalPowerCollectorBuilder.$inject = [
        'PhysicalLayerAdapter.SignalPowerCollector'
    ];

    function _SignalPowerCollectorBuilder(
        SignalPowerCollector
    ) {

        function build() {
            return new SignalPowerCollector();
        }

        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerAdapter.SignalPowerCollector', _SignalPowerCollector);

    _SignalPowerCollector.$inject = [
        'Common.AbstractValueCollector',
        'Common.MathUtil'
    ];

    function _SignalPowerCollector(
        AbstractValueCollector,
        MathUtil
    ) {
        var SignalPowerCollector;

        SignalPowerCollector = function () {
            AbstractValueCollector.apply(this, arguments);
        };
        
        SignalPowerCollector.prototype = Object.create(AbstractValueCollector.prototype);
        SignalPowerCollector.prototype.constructor = SignalPowerCollector;

        SignalPowerCollector.EMPTY_LIST_EXCEPTION = 'Cannot finalize SignalPowerCollector without any samples collected';

        SignalPowerCollector.prototype.$$finalize = function () {
            if (this.$$valueList.length === 0) {
                throw SignalPowerCollector.EMPTY_LIST_EXCEPTION;
            }
            
            return MathUtil.maxInArray(this.$$valueList);
        };

        return SignalPowerCollector;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerCore.ReceiveMulticoreWorkerThread', _ReceiveMulticoreWorkerThread);

    _ReceiveMulticoreWorkerThread.$inject = [];

    function _ReceiveMulticoreWorkerThread() {

        function $$getFormattedDevScriptList() {
            var i, src, isLast, scriptList = [];

            for (i = 0; i < AudioNetwork.devScriptList.length; i++) {
                src = AudioNetwork.bootConfig.devScriptBaseUrl + AudioNetwork.devScriptList[i];
                isLast = i === AudioNetwork.devScriptList.length - 1;
                scriptList.push('    \'' + src + '\'' + (isLast ? '' : ',') + '\n');
            }

            return scriptList;
        }

        function $$getFormattedProdScriptList() {
            var src, scriptList = [];

            src = AudioNetwork.bootConfig.prodScriptBaseUrl + AudioNetwork.bootConfig.prodScriptName;
            scriptList.push('    \'' + src + '\'' + '\n');

            return scriptList;
        }

        function getJavaScriptCode() {
            var js = '', scriptList;

            switch (AudioNetwork.bootConfig.multicoreState) {
                case AudioNetwork.MULTICORE_STATE.ENABLED_USE_DEV_SCRIPT:
                    scriptList = $$getFormattedDevScriptList();
                    break;
                case AudioNetwork.MULTICORE_STATE.ENABLED_USE_PROD_SCRIPT:
                    scriptList = $$getFormattedProdScriptList();
                    break;
            }

            js += 'self.importScripts(                                                                         ' + '\n';
            js += scriptList.join('');
            js += ');                                                                                          ' + '\n';
            js += '                                                                                            ' + '\n';
            js += 'var                                                                                         ' + '\n';
            js += '    iAlias = AudioNetwork.Injector,                                                         ' + '\n';
            js += '    ReceiveWorker = iAlias.resolve("PhysicalLayerCore.ReceiveWorker"),                      ' + '\n';
            js += '    ReceiveMulticoreWorker = iAlias.resolve("PhysicalLayerCore.ReceiveMulticoreWorker"),    ' + '\n';
            js += '    receiveWorker = undefined;                                                              ' + '\n';
            js += '                                                                                            ' + '\n';
            js += '// eval("console.log(\'eval inside thread test\');")                                        ' + '\n';
            js += '                                                                                            ' + '\n';
            js += 'self.onmessage = function(event) {                                                          ' + '\n';
            js += '    var                                                                                     ' + '\n';
            js += '        data = event.data,                                                                  ' + '\n';
            js += '        messageIndex = data.length > 0 ? data[0] : null,                                    ' + '\n';
            js += '        param = data.length > 0 ? data[1] : null,                                           ' + '\n';
            js += '        promise;                                                                            ' + '\n';
            js += '                                                                                            ' + '\n';
            js += '    switch (messageIndex) {                                                                 ' + '\n';
            js += '        case ReceiveMulticoreWorker.INITIALIZATION:                                         ' + '\n';
            js += '            receiveWorker = new ReceiveWorker(param);                                       ' + '\n';
            js += '            self.postMessage([                                                              ' + '\n';
            js += '                ReceiveMulticoreWorker.INITIALIZATION_SUCCESS                               ' + '\n';
            js += '            ]);                                                                             ' + '\n';
            js += '            break;                                                                          ' + '\n';
            js += '        case ReceiveMulticoreWorker.HANDLE_SAMPLE_BLOCK:                                    ' + '\n';
            js += '            promise = receiveWorker.handleSampleBlock(param);                               ' + '\n';
            js += '            break;                                                                          ' + '\n';
            js += '        case ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM:                                 ' + '\n';
            js += '            promise = receiveWorker.computeCrazySineSum(param);                             ' + '\n';
            js += '            break;                                                                          ' + '\n';
            js += '    }                                                                                       ' + '\n';
            js += '                                                                                            ' + '\n';
            js += '    if (!promise) {                                                                         ' + '\n';
            js += '        return;                                                                             ' + '\n';
            js += '    }                                                                                       ' + '\n';
            js += '                                                                                            ' + '\n';
            js += '    promise                                                                                 ' + '\n';
            js += '        .then(function (result) {                                                           ' + '\n';
            js += '            self.postMessage([                                                              ' + '\n';
            js += '                messageIndex + ReceiveMulticoreWorker.MESSAGE_INDEX_OFFSET_SUCCESS,         ' + '\n';
            js += '                result                                                                      ' + '\n';
            js += '            ]);                                                                             ' + '\n';
            js += '        })                                                                                  ' + '\n';
            js += '        .catch(function () {                                                                ' + '\n';
            js += '            self.postMessage([                                                              ' + '\n';
            js += '                messageIndex + ReceiveMulticoreWorker.MESSAGE_INDEX_OFFSET_FAIL,            ' + '\n';
            js += '                result                                                                      ' + '\n';
            js += '            ]);                                                                             ' + '\n';
            js += '        });                                                                                 ' + '\n';
            js += '}                                                                                           ' + '\n';
            js += '                                                                                            ' + '\n';

            return js;
        }

        return {
            getJavaScriptCode: getJavaScriptCode
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerCore.ReceiveMulticoreWorker', _ReceiveMulticoreWorker);

    _ReceiveMulticoreWorker.$inject = [
        'PhysicalLayerCore.ReceiveMulticoreWorkerThread',
        'Common.SimplePromiseBuilder'
    ];

    function _ReceiveMulticoreWorker(
        ReceiveMulticoreWorkerThread,
        SimplePromiseBuilder
    ) {
        var ReceiveMulticoreWorker;

        ReceiveMulticoreWorker = function (key) {
            var threadCode, blob, objectUrl;

            if (AudioNetwork.bootConfig.multicoreState === AudioNetwork.MULTICORE_STATE.DISABLED) {
                throw ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION;
            }

            threadCode = ReceiveMulticoreWorkerThread.getJavaScriptCode();
            blob = new Blob(
                [ threadCode ],
                { type: 'application/javascript' }
            );
            objectUrl = URL.createObjectURL(blob);

            this.$$key = key;
            this.$$worker = new Worker(objectUrl);
            this.$$worker.onmessage = this.$$onMessage.bind(this);

            this.$$promise = [];
            this.$$promise.length = ReceiveMulticoreWorker.MESSAGE_TOTAL;

            this.$$sendToThread(ReceiveMulticoreWorker.INITIALIZATION, this.$$key);
        };

        ReceiveMulticoreWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION = 'Multicore support is not enabled';
        ReceiveMulticoreWorker.PREVIOUS_PROMISE_NOT_RESOLVED_YET_EXCEPTION = 'Previous promise not resolved yet';

        ReceiveMulticoreWorker.INITIALIZATION = 0;
        ReceiveMulticoreWorker.INITIALIZATION_SUCCESS = 1;
        ReceiveMulticoreWorker.INITIALIZATION_FAIL = 2;
        ReceiveMulticoreWorker.HANDLE_SAMPLE_BLOCK = 3;
        ReceiveMulticoreWorker.HANDLE_SAMPLE_BLOCK_SUCCESS = 4;
        ReceiveMulticoreWorker.HANDLE_SAMPLE_BLOCK_FAIL = 5;
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM = 6;
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM_SUCCESS = 7;
        ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM_FAIL = 8;

        ReceiveMulticoreWorker.MESSAGE_TOTAL = 9;
        ReceiveMulticoreWorker.MESSAGE_INDEX_SPACING = 3;
        ReceiveMulticoreWorker.MESSAGE_INDEX_OFFSET_SUCCESS = 1;
        ReceiveMulticoreWorker.MESSAGE_INDEX_OFFSET_FAIL = 2;

        ReceiveMulticoreWorker.prototype.destroy = function() {
            if (this.$$worker) {
                this.$$worker.terminate();
                this.$$worker = undefined;
            }
        };

        ReceiveMulticoreWorker.prototype.getInitialization = function() {
            return this.$$promise[ReceiveMulticoreWorker.INITIALIZATION];
        };

        ReceiveMulticoreWorker.prototype.$$onMessage = function(event) {
            var
                data = event.data,
                messageIndex = data.length > 0 ? data[0] : null,
                result = data.length > 1 ? data[1] : null,
                promise,
                i;

            for (i = 0; i < this.$$promise.length; i++) {
                promise = this.$$promise[i];
                if (promise) {
                    switch (messageIndex % ReceiveMulticoreWorker.MESSAGE_INDEX_SPACING) {
                        case ReceiveMulticoreWorker.MESSAGE_INDEX_OFFSET_SUCCESS:
                            promise.resolve(result);
                            break;
                        case ReceiveMulticoreWorker.MESSAGE_INDEX_OFFSET_FAIL:
                            promise.reject(result);
                            break;
                    }
                    this.$$promise[i] = undefined;
                    break;
                }
            }
        };

        ReceiveMulticoreWorker.prototype.$$sendToThread = function (messageIndex, value) {
            if (this.$$promise[messageIndex]) {
                throw ReceiveWorker.PREVIOUS_PROMISE_NOT_RESOLVED_YET_EXCEPTION;
            }
            this.$$promise[messageIndex] = SimplePromiseBuilder.build();
            this.$$worker.postMessage([
                messageIndex,
                value
            ]);

            return this.$$promise[messageIndex];
        };

        ReceiveMulticoreWorker.prototype.computeCrazySineSum = function (value) {
            return this.$$sendToThread(ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM, value);
        };

        ReceiveMulticoreWorker.prototype.handleSampleBlock = function (value) {
            return this.$$sendToThread(ReceiveMulticoreWorker.HANDLE_SAMPLE_BLOCK, value);
        };

        return ReceiveMulticoreWorker;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerCore.ReceiveWorker', _ReceiveWorker);

    _ReceiveWorker.$inject = [
        'Common.CarrierRecoveryBuilder',
        'Common.MathUtil',
        'Common.SimplePromiseBuilder'
    ];

    function _ReceiveWorker(
        CarrierRecoveryBuilder,
        MathUtil,
        SimplePromiseBuilder
    ) {
        var ReceiveWorker;

        ReceiveWorker = function (key) {
            this.$$key = key;
            this.$$carrierRecovery = CarrierRecoveryBuilder.build(16, 16 * 1024);
        };

        ReceiveWorker.prototype.computeCrazySineSum = function (addValue) {
            var
                promise = SimplePromiseBuilder.build(),
                result = 0;

            for (var i = 0; i < 9000111; i++) {
                result += MathUtil.sin(i);
            }
            result = addValue + MathUtil.abs(result);
            promise.resolve({
                key: this.$$key,
                result: result
            });

            return promise;
        };

        ReceiveWorker.prototype.handleSampleBlock = function (sampleBlock) {
            var
                promise = SimplePromiseBuilder.build(),
                result,
                i;

            for (i = 0; i < 16 * 1024; i++) {
                this.$$carrierRecovery.handleSample(
                    Math.sin(2 * Math.PI * (i / 16 - 0.25))
                );
            }
            result = this.$$carrierRecovery.getCarrierDetail();

            promise.resolve({
                key: this.$$key,
                result: result
            });

            return promise;
        };

        return ReceiveWorker;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.MathUtil', _MathUtil);

    _MathUtil.$inject = [];

    function _MathUtil() {

        function abs(v) {
            return Math.abs(v);
        }

        function asin(v) {
            return Math.asin(v);
        }

        function sqrt(v) {
            return Math.sqrt(v);
        }

        function round(v) {
            return Math.round(v);
        }

        function random() {
            return Math.random();
        }

        function floor(v) {
            return Math.floor(v);
        }

        function sin(v) {
            return Math.sin(v);
        }

        function cos(v) {
            return Math.cos(v);
        }

        function log(v) {
            return Math.log(v);
        }

        function minInArray(v) {
            return Math.min.apply(null, v);
        }

        function maxInArray(v) {
            return Math.max.apply(null, v);
        }

        return {
            LN10: Math.LN10,
            HALF_PI: 0.5 * Math.PI,
            TWO_PI: 2 * Math.PI,
            PI: Math.PI,
            abs: abs,
            floor: floor,
            asin: asin,
            sqrt: sqrt,
            round: round,
            random: random,
            sin: sin,
            cos: cos,
            log: log,
            minInArray: minInArray,
            maxInArray: maxInArray
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.SimplePromiseBuilder', _SimplePromiseBuilder);

    _SimplePromiseBuilder.$inject = [
        'Common.SimplePromise'
    ];

    function _SimplePromiseBuilder(
        SimplePromise
    ) {

        function build() {
            return new SimplePromise();
        }

        function buildFromList(list) {
            var i, promise, thenCount, catchCount;

            promise = build();
            thenCount = 0;
            catchCount = 0;
            for (i = 0; i < list.length; i++) {
                list[i]
                    .then(function () {
                        thenCount++;
                    })
                    .catch(function () {
                        catchCount++;
                    })
                    .finally(function () {
                        if (thenCount + catchCount === list.length) {
                            if (catchCount === 0) {
                                promise.resolve();
                            } else {
                                promise.reject();
                            }
                        }
                    });
            }

            return promise;
        }

        return {
            build: build,
            buildFromList: buildFromList
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.SimplePromise', _SimplePromise);

    _SimplePromise.$inject = [];

    function _SimplePromise() {
        var SimplePromise;

        SimplePromise = function () {
            this.$$state = null;
            this.$$value = undefined;
            this.$$then = null;
            this.$$catch = null;
            this.$$finally = null;
        };

        SimplePromise.$$STATE_RESOLVE = 0;
        SimplePromise.$$STATE_REJECT = 1;

        SimplePromise.prototype.$$callbackInvoke = function () {
            switch (this.$$state) {
                case SimplePromise.$$STATE_RESOLVE:
                    if (this.$$then) {
                        this.$$then(this.$$value);
                        this.$$then = null;
                    }
                    if (this.$$finally) {
                        this.$$finally(this.$$value);
                        this.$$finally = null;
                    }
                    break;
                case SimplePromise.$$STATE_REJECT:
                    if (this.$$catch) {
                        this.$$catch(this.$$value);
                        this.$$catch = null;
                    }
                    if (this.$$finally) {
                        this.$$finally(this.$$value);
                        this.$$finally = null;
                    }
                    break;
            }
        };

        SimplePromise.prototype.resolve = function (value) {
            if (this.$$state !== null) {
                return;
            }

            this.$$state = SimplePromise.$$STATE_RESOLVE;
            this.$$value = value;
            this.$$callbackInvoke();
        };

        SimplePromise.prototype.reject = function (value) {
            if (this.$$state !== null) {
                return;
            }

            this.$$state = SimplePromise.$$STATE_REJECT;
            this.$$value = value;
            this.$$callbackInvoke();
        };

        SimplePromise.prototype.then = function (callback) {
            if (typeof callback === 'function') {
                this.$$then = callback;
            }
            this.$$callbackInvoke();
            return this;
        };

        SimplePromise.prototype.catch = function (callback) {
            if (typeof callback === 'function') {
                this.$$catch = callback;
            }
            this.$$callbackInvoke();
            return this;
        };

        SimplePromise.prototype.finally = function (callback) {
            if (typeof callback === 'function') {
                this.$$finally = callback;
            }
            this.$$callbackInvoke();
            return this;
        };

        return SimplePromise;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.WindowFunction', _WindowFunction);

    _WindowFunction.$inject = [
        'Common.MathUtil'
    ];

    function _WindowFunction(
        MathUtil
    ) {

        function blackmanNuttall(n, N) {
            return 0.3635819
                - 0.4891775 * MathUtil.cos(2 * MathUtil.PI * n / (N - 1))
                + 0.1365995 * MathUtil.cos(4 * MathUtil.PI * n / (N - 1))
                - 0.0106411 * MathUtil.cos(6 * MathUtil.PI * n / (N - 1));
        }

        return {
            blackmanNuttall: blackmanNuttall
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.StopwatchBuilder', _StopwatchBuilder);

    _StopwatchBuilder.$inject = [
        'Common.Stopwatch'
    ];

    function _StopwatchBuilder(
        Stopwatch
    ) {

        function build() {
            return new Stopwatch();
        }


        return {
            build: build
        };
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.Stopwatch', _Stopwatch);

    _Stopwatch.$inject = [
    ];

    function _Stopwatch(
    ) {
        var Stopwatch;

        Stopwatch = function () {
            this.$$running = false;
            this.$$timeStart = undefined;
            this.$$timeEnd = undefined;
        };

        Stopwatch.STOPWATCH_ALREADY_STARTED_EXCEPTION = 'Stopwatch already started';
        Stopwatch.STOPWATCH_ALREADY_STOPPED_EXCEPTION = 'Stopwatch already stopped';
        Stopwatch.RESET_BEFORE_CALLING_START_EXCEPTION = 'Reset stopwatch before calling start() again';
        Stopwatch.STOPWATCH_WAS_NOT_STARTED_EXCEPTION = 'stopwatch was not started';

        Stopwatch.$$_MILLISECOND_IN_SECOND = 1000;

        Stopwatch.prototype.reset = function () {
            this.$$running = false;
            this.$$timeStart = undefined;
            this.$$timeEnd = undefined;

            return this;
        };

        Stopwatch.prototype.start = function () {
            if (this.$$running) {
                throw Stopwatch.STOPWATCH_ALREADY_STARTED_EXCEPTION;
            }

            if (this.$$timeStart && this.$$timeEnd) {
                throw Stopwatch.RESET_BEFORE_CALLING_START_EXCEPTION;
            }

            this.$$timeStart = new Date();
            this.$$running = true;

            return this;
        };

        Stopwatch.prototype.stop = function () {
            if (!this.$$timeStart) {
                throw Stopwatch.STOPWATCH_WAS_NOT_STARTED_EXCEPTION;
            }

            if (!this.$$running) {
                throw Stopwatch.STOPWATCH_ALREADY_STOPPED_EXCEPTION;
            }

            this.$$timeEnd = new Date();
            this.$$running = false;

            return this;
        };

        Stopwatch.prototype.getDuration = function (inSeconds) {
            var
                millisecondDifference,
                now = new Date();

            if (!this.$$timeStart) {
                throw Stopwatch.STOPWATCH_WAS_NOT_STARTED_EXCEPTION;
            }

            if (this.$$running) {
                millisecondDifference = now.getTime() - this.$$timeStart.getTime();
            } else {
                millisecondDifference = this.$$timeEnd.getTime() - this.$$timeStart.getTime();
            }

            return inSeconds ? millisecondDifference / Stopwatch.$$_MILLISECOND_IN_SECOND : millisecondDifference;
        };

        return Stopwatch;
    }

})();

// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

if (AudioNetwork.bootConfig.createAlias) {
    // create aliases for easier access

    AudioNetwork.PhysicalLayer = {};
    AudioNetwork.PhysicalLayer.PhysicalLayer = AudioNetwork.Injector.resolve('PhysicalLayer.PhysicalLayer'); // deprecated
    AudioNetwork.PhysicalLayer.DefaultConfig = AudioNetwork.Injector.resolve('PhysicalLayer.DefaultConfig'); // deprecated
    AudioNetwork.PhysicalLayer.RxInput = AudioNetwork.Injector.resolve('PhysicalLayer.RxInput'); // deprecated

    AudioNetwork.PhysicalLayerAdapter = {};
    AudioNetwork.PhysicalLayerAdapter.TransmitAdapter = AudioNetwork.Injector.resolve('PhysicalLayerAdapter.TransmitAdapter'); // deprecated
    AudioNetwork.PhysicalLayerAdapter.ReceiveAdapter = AudioNetwork.Injector.resolve('PhysicalLayerAdapter.ReceiveAdapter'); // deprecated

    AudioNetwork.Audio = {};
    AudioNetwork.Audio.ActiveAudioContext = AudioNetwork.Injector.resolve('Audio.ActiveAudioContext'); // deprecated
    AudioNetwork.Audio.SimpleAudioContext = AudioNetwork.Injector.resolve('Audio.SimpleAudioContext'); // deprecated

    AudioNetwork.Common = {};
    AudioNetwork.Common.Queue = AudioNetwork.Injector.resolve('Common.Queue'); // deprecated
    AudioNetwork.Common.CarrierRecovery = AudioNetwork.Injector.resolve('Common.CarrierRecovery'); // deprecated
    AudioNetwork.Common.CarrierGenerate = AudioNetwork.Injector.resolve('Common.CarrierGenerate'); // deprecated
    AudioNetwork.Common.WindowFunction = AudioNetwork.Injector.resolve('Common.WindowFunction'); // probably deprecated
    AudioNetwork.Common.Util = AudioNetwork.Injector.resolve('Common.Util'); // deprecated

    AudioNetwork.Visualizer = {};
    AudioNetwork.Visualizer.AnalyserChart = AudioNetwork.Injector.resolve('Visualizer.AnalyserChart');
    AudioNetwork.Visualizer.ConstellationDiagram = AudioNetwork.Injector.resolve('Visualizer.ConstellationDiagram');
    AudioNetwork.Visualizer.PowerChart = AudioNetwork.Injector.resolve('Visualizer.PowerChart');
    AudioNetwork.Visualizer.SampleChart = AudioNetwork.Injector.resolve('Visualizer.SampleChart');
    AudioNetwork.Visualizer.FrequencyDomainChart = AudioNetwork.Injector.resolve('Visualizer.FrequencyDomainChart');
    AudioNetwork.Visualizer.ComplexPlaneChart = AudioNetwork.Injector.resolve('Visualizer.ComplexPlaneChart');
}

if (AudioNetwork.isNode) {
    module.exports = AudioNetwork;
}
