/*
The MIT License (MIT)

Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    AudioNetwork = {},                                        // namespace visible to the global JavaScript scope
    AudioNetworkBootConfig = AudioNetworkBootConfig || {};    // injects boot config

AudioNetwork.version = '1.3.2';

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
        : true,
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
    'data-link-layer/checksum-service.js',
    'data-link-layer/data-link-layer-builder.js',
    'data-link-layer/data-link-layer.js',
    'data-link-layer/frame.js',
    'data-link-layer/tx-frame-manager.js',
    'data-link-layer/tx-frame.js',
    'dsp/complex.js',
    'dsp/correlator.js',
    'dsp/fft-result.js',
    'dsp/fft.js',
    'dsp/wave-analyser.js',
    'dsp/wave-generator.js',
    'physical-layer/physical-layer-builder.js',
    'physical-layer/physical-layer.js',
    'physical-layer/rx-sync-detector.js',
    'physical-layer/tx-symbol-manager.js',
    'physical-layer/tx-symbol.js',
    'util/buffer.js',
    'util/frequency-calculator.js',
    'util/music-calculator.js',
    'util/smart-timer.js',
    'util/wav-audio-file.js',
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
    'web-audio/audio-mono-io-lite.js',
    'web-audio/audio-mono-io.js',
    'audio-network-end.js'
];

if (AudioNetwork.isBrowser && AudioNetwork.bootConfig.devScriptLoad) {
    // start from index 1 because audio-network-boot.js was already loaded
    AudioNetwork.DynamicScriptLoader.loadList(AudioNetwork.devScriptList, 1);
}

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Dsp.Complex', Complex);

    Complex.$inject = [];

    function Complex() {
        var Complex;

        Complex = function (real, imag) {
            this.$$real = real;
            this.$$imag = imag;
        };

        Complex.$$_EPSILON = 0.000001;
        Complex.$$_UNIT_RADIUS = 1;

        Complex.prototype.clone = function () {
            return new Complex(
                this.$$real,
                this.$$imag
            );
        };

        Complex.polar = function (unitAngle, magnitude) {
            var radian;

            magnitude = typeof magnitude === 'undefined'
                ? Complex.$$_UNIT_RADIUS
                : magnitude;

            radian = 2 * Math.PI * unitAngle;

            return new Complex(
                magnitude * Math.cos(radian),
                magnitude * Math.sin(radian)
            );
        };

        Complex.zero = function () {
            return new Complex(0, 0);
        };

        Complex.prototype.swap = function () {
            var tmp = this.$$real;

            this.$$real = this.$$imag;
            this.$$imag = tmp;

            return this;
        };

        Complex.prototype.add = function (b) {
            this.$$real += b.$$real;
            this.$$imag += b.$$imag;

            return this;
        };

        Complex.prototype.subtract = function (b) {
            this.$$real -= b.$$real;
            this.$$imag -= b.$$imag;

            return this;
        };

        Complex.prototype.multiply = function (b) {
            var
                real = this.$$real * b.$$real - this.$$imag * b.$$imag,
                imag = this.$$real * b.$$imag + this.$$imag * b.$$real;

            this.$$real = real;
            this.$$imag = imag;

            return this;
        };

        Complex.prototype.conjugate = function () {
            this.$$imag *= -1;

            return this;
        };

        Complex.prototype.multiplyScalar = function (b) {
            this.$$real *= b;
            this.$$imag *= b;

            return this;
        };

        Complex.prototype.divideScalar = function (b) {
            this.$$real /= b;
            this.$$imag /= b;

            return this;
        };

        Complex.prototype.getReal = function () {
            return this.$$real;
        };

        Complex.prototype.getImaginary = function () {
            return this.$$imag;
        };

        Complex.prototype.getMagnitude = function () {
            return Math.sqrt(
                this.$$real * this.$$real +
                this.$$imag * this.$$imag
            );
        };

        Complex.prototype.getUnitAngle = function () {
            var x, y, magnitude, quarter, angle, unitAngle;

            x = this.$$real;
            y = this.$$imag;
            magnitude = this.getMagnitude();
            magnitude = magnitude < Complex.$$_EPSILON  // prevents from dividing by zero
                ? Complex.$$_EPSILON
                : magnitude;

            //         ^             Legend:
            //  II     *     I        '!' = 0 degrees
            //         |              '*' = 90 degrees
            //  ----@--+--!---->      '@' = 180 degrees
            //         |              '%' = 270 degrees
            //  III    %     IV

            quarter = (y >= 0)
                ? (x >= 0 ? 1 : 2)
                : (x <= 0 ? 3 : 4);

            switch (quarter) {
                case 1:
                    angle = Math.asin(y / magnitude);
                    break;
                case 2:
                    angle = Math.asin(-x / magnitude) + 0.5 * Math.PI;
                    break;
                case 3:
                    angle = Math.asin(-y / magnitude) + Math.PI;
                    break;
                case 4:
                    angle = Math.asin(x / magnitude) + 1.5 * Math.PI;
                    break;
            }

            unitAngle = angle / (2 * Math.PI);

            return unitAngle;
        };

        Complex.prototype.normalize = function () {
            this.divideScalar(
                this.getMagnitude()
            );

            return this;
        };

        return Complex;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Dsp.Correlator', Correlator);

    Correlator.$inject = [
        'Rewrite.Util.Buffer'
    ];

    function Correlator(
        Buffer
    ) {
        var Correlator;

        Correlator = function (skipFactor, correlationCode) {
            this.$$correlationCode = correlationCode
                ? correlationCode.slice(0)
                : Correlator.DEFAULT_CORRELATION_CODE.slice(0);

            this.$$skipFactor = undefined;
            this.$$dataBuffer = undefined;
            this.$$signalDecibelBuffer = undefined;
            this.$$noiseDecibelBuffer = undefined;
            this.$$cacheCorrelactionValue = undefined;
            this.$$cacheSignalDecibelAverage = undefined;
            this.$$cacheNoiseDecibelAverage = undefined;

            this.$$setSkipFactor(skipFactor);
        };

        Correlator.DEFAULT_CORRELATION_CODE = [1, 1, 1, -1, -1, -1, 1, -1, -1, 1, -1]; // Barker Code 11

        Correlator.CORRELATION_POSITIVE = 'CORRELATION_POSITIVE';
        Correlator.CORRELATION_NONE = 'CORRELATION_NONE';
        Correlator.CORRELATION_NEGATIVE = 'CORRELATION_NEGATIVE';

        Correlator.THRESHOLD_UNIT = 0.9;
        Correlator.NO_DECIBEL = null;
        Correlator.NO_DATA = 0;

        Correlator.POSITION_OUT_OF_RANGE_EXCEPTION = 'Position out of range';

        Correlator.prototype.reset = function () {
            this.$$setSkipFactor(this.$$skipFactor);     // setting skip factor is like reset
        };

        Correlator.prototype.handle = function (correlationCodeValue, signalDecibel, noiseDecibel) {
            var data, isValidDecibel;

            data = Correlator.NO_DATA;
            switch (correlationCodeValue) {
                case -1:
                case 1:
                    data = correlationCodeValue;
            }
            this.$$dataBuffer.pushEvenIfFull(data);

            isValidDecibel = data && (signalDecibel || signalDecibel === 0);
            this.$$signalDecibelBuffer.pushEvenIfFull(
                isValidDecibel ? signalDecibel : Correlator.NO_DECIBEL
            );

            isValidDecibel = data && (noiseDecibel || noiseDecibel === 0);
            this.$$noiseDecibelBuffer.pushEvenIfFull(
                isValidDecibel ? noiseDecibel : Correlator.NO_DECIBEL
            );

            this.$$clearCache();
        };

        Correlator.prototype.isCorrelated = function () {
            var correlation = this.getCorrelation();

            return (
                correlation === Correlator.CORRELATION_NEGATIVE ||
                correlation === Correlator.CORRELATION_POSITIVE
            );
        };

        Correlator.prototype.getCorrelation = function () {
            var
                correlationValue = this.getCorrelationValue(),
                threshold = Math.floor(Correlator.THRESHOLD_UNIT * this.$$correlationCode.length);

            if (correlationValue >= threshold) {
                return Correlator.CORRELATION_POSITIVE;
            }
            if (correlationValue > -threshold) {
                return Correlator.CORRELATION_NONE;
            }

            return Correlator.CORRELATION_NEGATIVE;
        };

        Correlator.prototype.getCorrelationValue = function () {
            var i, lastIndexInSkipBlock, bufferIndex, data, correlationCode, result;

            if (this.$$cacheCorrelactionValue !== undefined) {
                return this.$$cacheCorrelactionValue;
            }

            result = 0;
            lastIndexInSkipBlock = this.$$skipFactor - 1;
            for (i = 0; i < this.$$correlationCode.length; i++) {
                bufferIndex = lastIndexInSkipBlock + i * this.$$skipFactor;
                data = this.$$dataBuffer.getItem(bufferIndex);
                if (data !== Correlator.NO_DATA) {
                    correlationCode = this.$$correlationCode[i];
                    result += data * correlationCode;
                }
            }

            this.$$cacheCorrelactionValue = result;

            return result;
        };

        Correlator.prototype.getSignalDecibelAverage = function () {
            if (this.$$cacheSignalDecibelAverage === undefined) {
                this.$$cacheSignalDecibelAverage = this.$$getDecibelAverage(this.$$signalDecibelBuffer);
            }

            return this.$$cacheSignalDecibelAverage;
        };

        Correlator.prototype.getNoiseDecibelAverage = function () {
            if (this.$$cacheNoiseDecibelAverage === undefined) {
                this.$$cacheNoiseDecibelAverage = this.$$getDecibelAverage(this.$$noiseDecibelBuffer);
            }

            return this.$$cacheNoiseDecibelAverage;
        };

        Correlator.prototype.getSignalToNoiseRatio = function () {
            var
                signalDecibelAverage = this.getSignalDecibelAverage(),
                noiseDecibelAverage = this.getNoiseDecibelAverage(),
                signalToNoiseRatio = 0,
                isAbleToCompute;

            isAbleToCompute =
                signalDecibelAverage !== Correlator.NO_DECIBEL &&
                noiseDecibelAverage !== Correlator.NO_DECIBEL;

            if (isAbleToCompute) {
                signalToNoiseRatio = signalDecibelAverage - noiseDecibelAverage;
            }

            return signalToNoiseRatio;
        };

        Correlator.prototype.getCorrelationCodeLength = function () {
            return this.$$correlationCode.length;
        };

        Correlator.prototype.$$clearCache = function () {
            this.$$cacheCorrelactionValue = undefined;
            this.$$cacheSignalDecibelAverage = undefined;
            this.$$cacheNoiseDecibelAverage = undefined;
        };

        Correlator.prototype.$$getDecibelAverage = function (buffer) {
            var i, lastIndexInSkipBlock, bufferIndex, value, sum, sumLength, average;

            sum = 0;
            sumLength = 0;
            lastIndexInSkipBlock = this.$$skipFactor - 1;
            for (i = 0; i < this.$$correlationCode.length; i++) {
                bufferIndex = lastIndexInSkipBlock + i * this.$$skipFactor;
                value = buffer.getItem(bufferIndex);
                if (value !== Correlator.NO_DECIBEL) {
                    sum += value;
                    sumLength++;
                }
            }

            average = (sumLength > 0)
                ? sum / sumLength
                : Correlator.NO_DECIBEL;

            return average;
        };

        Correlator.prototype.$$setSkipFactor = function (skipFactor) {
            var i, bufferMaxSize;

            skipFactor = skipFactor || 1;
            bufferMaxSize = this.$$correlationCode.length * skipFactor;

            this.$$skipFactor = skipFactor;
            this.$$dataBuffer = new Buffer(bufferMaxSize);
            this.$$signalDecibelBuffer = new Buffer(bufferMaxSize);
            this.$$noiseDecibelBuffer = new Buffer(bufferMaxSize);
            this.$$cacheCorrelactionValue = undefined;
            this.$$cacheSignalDecibelAverage = undefined;
            this.$$cacheNoiseDecibelAverage = undefined;

            for (i = 0; i < bufferMaxSize; i++) {
                this.$$dataBuffer.pushEvenIfFull(Correlator.NO_DATA);
                this.$$signalDecibelBuffer.pushEvenIfFull(Correlator.NO_DECIBEL);
                this.$$noiseDecibelBuffer.pushEvenIfFull(Correlator.NO_DECIBEL);
            }
        };

        return Correlator;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// TODO add ranges check
// TODO rename to FftResult

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Dsp.FFTResult', FFTResult);

    FFTResult.$inject = [];

    function FFTResult() {
        var FFTResult;

        FFTResult = function (fftData, sampleRate) {
            this.$$fftData = fftData;
            this.$$sampleRate = sampleRate;
        };

        FFTResult.$$_FREQUENCY_BIN_INDEX_ZERO = 0;
        FFTResult.$$_FREQUENCY_BIN_INDEX_FIRST = 1;
        FFTResult.$$_EQUAL_EPSILON = 0.001;
        FFTResult.$$_HALF = 0.5;

        FFTResult.VALUES_OUT_OF_RANGE = 'Values out of range';

        FFTResult.prototype.downconvert = function (skipFactor) {
            var
                newFftData = [],
                factorHalf = Math.floor(skipFactor / 2),
                sampleRateCorrection,
                max,
                i,
                j;

            for (i = 0; i < this.$$fftData.length; i += skipFactor) {
                max = this.$$fftData[i];
                for (j = Math.max(0, i - factorHalf); j < Math.min(i - factorHalf + skipFactor, this.$$fftData.length); j++) {
                    max = this.$$fftData[j] > max ? this.$$fftData[j] : max;
                }
                newFftData.push(max);
            }

            sampleRateCorrection = skipFactor * newFftData.length / this.$$fftData.length;
            this.$$sampleRate *= sampleRateCorrection;

            this.$$fftData = newFftData;
        };

        FFTResult.prototype.getLoudestBinIndex = function (frequencyStart, frequencyEnd) {
            return this.$$getLoudestBinIndexInRange(
                frequencyStart,
                frequencyEnd
            );
        };

        FFTResult.prototype.getLoudestBinIndexInBinRange = function (binIndexStart, binIndexEnd) {
            var frequencyBinCount = FFTResult.$$_HALF * this.getFFTSize();

            if (binIndexStart < 0 || binIndexEnd >= frequencyBinCount) {
                throw FFTResult.VALUES_OUT_OF_RANGE;
            }

            return FFTResult.$$findMaxIndexInRange(
                this.$$fftData,
                binIndexStart,
                binIndexEnd
            );
        };

        FFTResult.prototype.getLoudestFrequency = function (frequencyStart, frequencyEnd) {
            var
                loudestBinIndex = this.$$getLoudestBinIndexInRange(
                    frequencyStart,
                    frequencyEnd
                );

            return FFTResult.getFrequency(
                loudestBinIndex,
                this.$$sampleRate,
                this.getFFTSize()
            );
        };

        FFTResult.prototype.getLoudestDecibel = function (frequencyStart, frequencyEnd) {
            var
                loudestBinIndex = this.$$getLoudestBinIndexInRange(
                    frequencyStart,
                    frequencyEnd
                );

            return this.$$fftData[loudestBinIndex];
        };

        FFTResult.prototype.getDecibelAverage = function (binIndexStart, binIndexEnd, binIndexExcluded) {
            var
                frequencyBinCount = FFTResult.$$_HALF * this.getFFTSize(),
                itemNumber,
                sum,
                average,
                i;

            if (binIndexStart < 0 || binIndexEnd >= frequencyBinCount) {
                throw FFTResult.VALUES_OUT_OF_RANGE;
            }

            itemNumber = 0;
            sum = 0;
            for (i = binIndexStart; i <= binIndexEnd; i++) {
                if (typeof binIndexExcluded === 'undefined' || i !== binIndexExcluded) {
                    sum += this.getDecibel(i);
                    itemNumber++;
                }
            }

            average = 0;
            if (itemNumber > 0) {
                average = sum / itemNumber;
            }

            return average;
        };

        FFTResult.prototype.getDecibelRange = function (binIndexStart, binIndexEnd) {
            var
                frequencyBinCount = FFTResult.$$_HALF * this.getFFTSize(),
                result = [],
                i;

            if (binIndexStart < 0 || binIndexEnd >= frequencyBinCount) {
                throw FFTResult.VALUES_OUT_OF_RANGE;
            }

            for (i = binIndexStart; i <= binIndexEnd; i++) {
                result.push(
                    this.getDecibel(i)
                );
            }

            return result;
        };

        FFTResult.prototype.getDecibel = function (frequencyBinIndex) {
            return this.$$fftData[frequencyBinIndex];
        };

        FFTResult.prototype.getDecibelFromFrequency = function (frequency) {
            var binIndex = this.getBinIndex(frequency);

            return this.$$fftData[binIndex];
        };

        FFTResult.prototype.getFrequencyData = function () {
            return this.$$fftData;
        };

        FFTResult.prototype.getFrequency = function (frequencyBinIndex) {
            return FFTResult.getFrequency(
                frequencyBinIndex,
                this.$$sampleRate,
                this.getFFTSize()
            );
        };

        FFTResult.prototype.getFrequencyOfClosestBin = function (frequency) {
            return FFTResult.getFrequencyOfClosestBin(
                frequency,
                this.$$sampleRate,
                this.getFFTSize()
            );
        };

        FFTResult.prototype.getBinIndex = function (frequency) {
            return FFTResult.getBinIndex(
                frequency,
                this.$$sampleRate,
                this.getFFTSize()
            );
        };

        FFTResult.prototype.getResolution = function () {
            return FFTResult.getResolution(
                this.$$sampleRate,
                this.getFFTSize()
            );
        };

        FFTResult.prototype.getLastBinIndex = function () {
            return this.$$fftData.length - 1;
        };

        FFTResult.prototype.getLastFrequency = function () {
            return this.getFrequency(
                this.getLastBinIndex()
            );
        };

        FFTResult.prototype.getNyquistFrequency = function () {
            return FFTResult.$$_HALF * this.$$sampleRate;
        };

        FFTResult.prototype.getSampleRate = function () {
            return this.$$sampleRate;
        };

        FFTResult.prototype.getFFTSize = function () {
            return this.$$fftData.length * 2;
        };

        FFTResult.prototype.equal = function (fftResult) {
            var
                i,
                absDiff,
                isFrequencyEqual,
                isFFTSizeEqual,
                isAllDecibelEqual;

            isFrequencyEqual = FFTResult.$$isEqual(
                this.getNyquistFrequency(),
                fftResult.getNyquistFrequency()
            );
            isFFTSizeEqual = FFTResult.$$isEqual(
                this.getFFTSize(),
                fftResult.getFFTSize()
            );

            if (!isFrequencyEqual || !isFFTSizeEqual) {
                return false;
            }

            isAllDecibelEqual = true;
            for (i = 0; i < this.$$fftData.length; i++) {
                absDiff = Math.abs(
                    this.$$fftData[i] - fftResult.getDecibel(i)
                );
                if (absDiff > FFTResult.$$_EQUAL_EPSILON) {
                    isAllDecibelEqual = false;
                    break;
                }
            }

            return isAllDecibelEqual;
        };

        FFTResult.prototype.$$getLoudestBinIndexInRange = function (frequencyStart, frequencyEnd) {
            var
                frequencyBinIndexStart,
                frequencyBinIndexEnd,
                loudestBinIndex;

            frequencyStart = FFTResult.$$getValueOrDefault(
                frequencyStart,
                FFTResult.$$_FREQUENCY_BIN_INDEX_ZERO
            );
            frequencyEnd = FFTResult.$$getValueOrDefault(
                frequencyEnd,
                this.getLastFrequency()
            );

            frequencyBinIndexStart = this.getBinIndex(frequencyStart);
            frequencyBinIndexEnd = this.getBinIndex(frequencyEnd);

            loudestBinIndex = FFTResult.$$findMaxIndexInRange(
                this.$$fftData,
                frequencyBinIndexStart,
                frequencyBinIndexEnd
            );

            return loudestBinIndex;
        };

        FFTResult.$$isEqual = function (a, b) {
            return a === b;
        };

        FFTResult.$$getValueOrDefault = function (value, defaultValue) {
            return typeof value !== 'undefined' ? value : defaultValue;
        };

        FFTResult.$$findMaxIndexInRange = function (data, indexMin, indexMax) {
            var maxIndex, max, i;

            maxIndex = -1;
            max = undefined;
            for (i = indexMin; i <= indexMax; i++) {
                if (maxIndex === -1 || data[i] > max) {
                    max = data[i];
                    maxIndex = i;
                }
            }

            return maxIndex;
        };

        FFTResult.getResolution = function (sampleRate, fftSize) {
            return FFTResult.getFrequency(
                FFTResult.$$_FREQUENCY_BIN_INDEX_FIRST,
                sampleRate,
                fftSize
            );
        };

        FFTResult.getFrequency = function (frequencyBinIndex, sampleRate, fftSize) {
            var frequencyBinCount = FFTResult.$$_HALF * fftSize;

            if (frequencyBinIndex < 0 || frequencyBinIndex >= frequencyBinCount) {
                throw FFTResult.VALUES_OUT_OF_RANGE;
            }

            return frequencyBinIndex * sampleRate / fftSize;
        };

        FFTResult.getBinIndex = function (frequency, sampleRate, fftSize) {
            var
                frequencyBinIndex = Math.round(frequency * fftSize / sampleRate),
                frequencyBinCount = FFTResult.$$_HALF * fftSize;

            if (frequencyBinIndex < 0 || frequencyBinIndex >= frequencyBinCount) {
                throw FFTResult.VALUES_OUT_OF_RANGE;
            }

            return frequencyBinIndex;
        };

        FFTResult.getFrequencyOfClosestBin = function (frequency, sampleRate, fftSize) {
            var binIndex = FFTResult.getBinIndex(frequency, sampleRate, fftSize);

            return FFTResult.getFrequency(
                binIndex,
                sampleRate,
                fftSize
            );
        };

        return FFTResult;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Dsp.Fft', Fft);

    Fft.$inject = [
        'Rewrite.Dsp.Complex'
    ];

    function Fft(
        Complex
    ) {
        var Fft;

        Fft = function () {
        };

        Fft.forward = function (input) {
            var
                n = input.length,
                nHalf,
                even,
                odd,
                output = [],
                wnkMultiplied,
                wnk,
                k,
                unitAngle;

            if (n === 1) {
                return input;
            }

            // even and odd parts
            even = Fft.forward(Fft.$$getHalf(input, 0));
            odd = Fft.forward(Fft.$$getHalf(input, 1));

            // combine
            output.length = n;
            nHalf = n / 2;
            for (k = 0; k < nHalf; k++) {
                unitAngle = -k / n;
                wnk = Complex.polar(unitAngle);
                wnkMultiplied = wnk.clone().multiply(odd[k]);
                output[k] = even[k].clone().add(wnkMultiplied);
                output[nHalf + k] = even[k].clone().subtract(wnkMultiplied);
            }

            return output;
        };

        Fft.inverse = function (input) {
            var
                output = [],
                i;

            for (i = 0; i < input.length; i++) {
                output.push(input[i].clone().swap());
            }
            output = Fft.forward(output);
            for (i = 0; i < output.length; i++) {
                output[i].swap().divideScalar(output.length);
            }

            return output;
        };

        Fft.$$getHalf = function (list, offset) {
            var i, listHalf, item, lengthHalf;

            listHalf = [];
            lengthHalf = list.length / 2;
            for (i = 0; i < lengthHalf; i++) {
                item = list[i * 2 + offset];
                listHalf.push(item);
            }

            return listHalf;
        };

        return Fft;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Dsp.WaveAnalyser', WaveAnalyser);

    WaveAnalyser.$inject = [
        'Rewrite.Dsp.Complex',
        'Rewrite.Util.Buffer'
    ];

    function WaveAnalyser(
        Complex,
        Buffer
    ) {
        var WaveAnalyser;

        WaveAnalyser = function (samplePerPeriod, windowSize, applyWindowFunction) {
            samplePerPeriod = samplePerPeriod || WaveAnalyser.$$_DEFAULT_SAMPLE_PER_PERIOD;
            windowSize = windowSize || WaveAnalyser.$$_DEFAULT_WINDOW_SIZE;

            this.$$cyclePerSample = null;
            this.$$firstSampleOfBufferNumber = null;
            this.setSamplePerPeriod(samplePerPeriod);
            this.$$sampleBuffer = new Buffer(windowSize);
            this.$$applyWindowFunction = !!applyWindowFunction;
            this.$$frequencyBin = null;
        };

        WaveAnalyser.$$_UNIT_PHASE = 1;
        WaveAnalyser.$$_NEGATIVE_FREQUENCIES_AMPLITUDE_FIX = 2;
        WaveAnalyser.$$_PHASE_CORRECTION = 0.75;
        WaveAnalyser.$$_DECIBEL_POWER_FROM_AMPLITUDE_FACTOR = 20;
        WaveAnalyser.$$_DEFAULT_SAMPLE_PER_PERIOD = 32;
        WaveAnalyser.$$_DEFAULT_WINDOW_SIZE = 1024;

        WaveAnalyser.prototype.$$computeFrequencyBin = function () {
            var
                size,
                i,
                n,
                unitAngle,
                complex,
                sampleValue,
                windowFunctionValue;

            this.$$frequencyBin = Complex.zero();

            size = this.$$sampleBuffer.getSize();
            for (i = 0; i < size; i++) {
                n = this.$$firstSampleOfBufferNumber + i;
                unitAngle = this.$$cyclePerSample * n;
                complex = Complex.polar(-unitAngle);

                sampleValue = this.$$sampleBuffer.getItem(i);
                complex.multiplyScalar(sampleValue);

                if (this.$$applyWindowFunction) {
                    windowFunctionValue = WaveAnalyser.blackman(i, size);
                    complex.multiplyScalar(windowFunctionValue);
                }

                this.$$frequencyBin.add(complex);
            }
        };

        WaveAnalyser.prototype.setSamplePerPeriod = function (samplePerPeriod) {
            this.$$cyclePerSample = 1 / samplePerPeriod;
            this.$$firstSampleOfBufferNumber = 0;
            this.$$frequencyBin = null;
        };

        WaveAnalyser.prototype.setWindowSize = function (windowSize) {
            this.$$sampleBuffer.setSizeMax(windowSize);  // this call clears the buffer too
            this.$$firstSampleOfBufferNumber = 0;
            this.$$frequencyBin = null;
        };

        WaveAnalyser.prototype.enableWindowFunction = function () {
            this.$$applyWindowFunction = true;
            this.$$frequencyBin = null;
        };

        WaveAnalyser.prototype.disableWindowFunction = function () {
            this.$$applyWindowFunction = false;
            this.$$frequencyBin = null;
        };

        WaveAnalyser.prototype.handle = function (sample) {
            if (this.$$sampleBuffer.isFull()) {
                this.$$firstSampleOfBufferNumber++;
            }
            this.$$sampleBuffer.pushEvenIfFull(sample);
            this.$$frequencyBin = null;
        };

        WaveAnalyser.prototype.getAmplitude = function () {
            var magnitude, tmp, amplitude;

            if (!this.$$frequencyBin) {
                this.$$computeFrequencyBin();
            }

            magnitude = this.$$frequencyBin.getMagnitude();
            tmp = magnitude / this.$$sampleBuffer.getSize();

            // for real samples half of the energy is in negative frequency
            amplitude = tmp * WaveAnalyser.$$_NEGATIVE_FREQUENCIES_AMPLITUDE_FIX;

            // amplitude is valid only when window function is disabled and
            // you have pure sine waves in the signal with integer number of
            // cycles in the window size (no 'leakage')

            return amplitude;
        };

        WaveAnalyser.prototype.getUnitPhase = function () {
            var unitAngle, tmp, unitPhase;

            if (!this.$$frequencyBin) {
                this.$$computeFrequencyBin();
            }

            unitAngle = this.$$frequencyBin.getUnitAngle();
            // sine wave without any phase offset is a complex number with real part equal zero
            // and imaginary part on the negative side (vector pointing downwards -> 270 degrees)
            tmp = unitAngle - WaveAnalyser.$$_PHASE_CORRECTION;
            // correction from line above may produce negative phase so we need to fix it
            tmp = tmp < 0
                ? tmp + WaveAnalyser.$$_UNIT_PHASE
                : tmp;
            // fix direction - when sine wave is moving to the right in time domain
            // then phase angle should increase counter-clockwise
            tmp = WaveAnalyser.$$_UNIT_PHASE - tmp;

            unitPhase = tmp % WaveAnalyser.$$_UNIT_PHASE; // keep phase in <0, 1) range

            return unitPhase;
        };

        WaveAnalyser.prototype.getDecibel = function () {
            var decibel, amplitude;

            if (!this.$$frequencyBin) {
                this.$$computeFrequencyBin();
            }

            amplitude = this.getAmplitude();
            decibel = WaveAnalyser.$$_DECIBEL_POWER_FROM_AMPLITUDE_FACTOR *
                Math.log(amplitude) / Math.LN10;

            return decibel;
        };

        WaveAnalyser.prototype.getFrequencyBin = function () {
            if (!this.$$frequencyBin) {
                this.$$computeFrequencyBin();
            }

            return this.$$frequencyBin.clone();
        };

        WaveAnalyser.blackmanNuttall = function (n, N) {
            return 0.3635819
                - 0.4891775 * Math.cos(2 * Math.PI * n / (N - 1))
                + 0.1365995 * Math.cos(4 * Math.PI * n / (N - 1))
                - 0.0106411 * Math.cos(6 * Math.PI * n / (N - 1));
        };

        // https://www.w3.org/TR/webaudio/#fft-windowing-and-smoothing-over-time
        WaveAnalyser.blackman = function (n, N) {
            var
                alpha = 0.16,
                a0 = 0.5 * (1 - alpha),
                a1 = 0.5,
                a2 = 0.5 * alpha;

            return a0
                - a1 * Math.cos(2 * Math.PI * n / (N - 1))
                + a2 * Math.cos(4 * Math.PI * n / (N - 1));
        };

        return WaveAnalyser;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Dsp.WaveGenerator', WaveGenerator);

    WaveGenerator.$inject = [];

    function WaveGenerator() {
        var WaveGenerator;

        WaveGenerator = function (samplePerPeriod) {
            samplePerPeriod = samplePerPeriod || WaveGenerator.$$_DEFAULT_SAMPLE_PER_PERIOD;

            this.$$omega = null;
            this.$$sampleNumber = null;
            this.setSamplePerPeriod(samplePerPeriod);
            this.$$phase = WaveGenerator.NO_PHASE_SHIFT;
            this.$$amplitude = WaveGenerator.UNIT_AMPLITUDE;
            this.$$sample = null;
        };

        WaveGenerator.UNIT_AMPLITUDE = 1;
        WaveGenerator.NO_PHASE_SHIFT = 0;
        WaveGenerator.$$_DEFAULT_SAMPLE_PER_PERIOD = 32;

        WaveGenerator.prototype.$$computeSample = function () {
            var x;

            x = this.$$omega * this.$$sampleNumber;
            this.$$sample = this.$$amplitude * Math.sin(x - this.$$phase);
        };

        WaveGenerator.prototype.setSamplePerPeriod = function (samplePerPeriod) {
            this.$$omega = 2 * Math.PI / samplePerPeriod;
            this.$$sampleNumber = 0;
        };

        WaveGenerator.prototype.setUnitPhase = function (unitPhase) {
            this.$$phase = 2 * Math.PI * unitPhase;  // convert to radians
        };

        WaveGenerator.prototype.setAmplitude = function (amplitude) {
            this.$$amplitude = amplitude;
        };

        WaveGenerator.prototype.nextSample = function () {
            this.$$sampleNumber++;
            this.$$sample = null;       // clear cache
        };

        WaveGenerator.prototype.getSample = function () {
            if (this.$$sample === null) {
                this.$$computeSample();
            }

            return this.$$sample;
        };

        return WaveGenerator;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.PhysicalLayer.PhysicalLayerBuilder', PhysicalLayerBuilder);

    PhysicalLayerBuilder.$inject = [
        'Rewrite.PhysicalLayer.PhysicalLayer'
    ];

    function PhysicalLayerBuilder(
        PhysicalLayer
    ) {
        var PhysicalLayerBuilder;

        PhysicalLayerBuilder = function () {
            this._fftSize = 8192;
            this._unitTime = 0.25;
            this._fftSkipFactor = 3;
            this._microphoneMode = PhysicalLayer.MICROPHONE_MODE_ALWAYS_ON;
            this._samplePerSymbol = 2;
            this._symbolMin44100 = 114;
            this._symbolMin48000 = 82;
            this._symbolMinDefault = 1;
            this._symbolRange = 256 + 2;    // 256 for data, 2 for "sync"
            this._correlationCode = [1, -1, 1, -1];

            this._txSampleRate = 44100;
            this._txAmplitude = 0.2;

            this._rxSignalDecibelThresholdFactor = 0.6;

            this._rxSymbolListener = undefined;
            this._rxSyncStatusListener = undefined;
            this._rxSampleDspDetailsListener = undefined;
            this._rxSyncDspDetailsListener = undefined;
            this._rxDspConfigListener = undefined;

            this._dspConfigListener = undefined;

            this._txSymbolListener = undefined;
            this._txSymbolProgressListener = undefined;
            this._txDspConfigListener = undefined;
        };

        PhysicalLayerBuilder.prototype.fftSize = function (fftSize) {
            this._fftSize = fftSize;
            return this;
        };

        PhysicalLayerBuilder.prototype.unitTime = function (unitTime) {
            this._unitTime = unitTime;
            return this;
        };

        PhysicalLayerBuilder.prototype.fftSkipFactor = function (fftSkipFactor) {
            this._fftSkipFactor = fftSkipFactor;
            return this;
        };

        PhysicalLayerBuilder.prototype.microphoneMode = function (microphoneMode) {
            this._microphoneMode = microphoneMode;
            return this;
        };

        PhysicalLayerBuilder.prototype.samplePerSymbol = function (samplePerSymbol) {
            this._samplePerSymbol = samplePerSymbol;
            return this;
        };

        PhysicalLayerBuilder.prototype.symbolMin44100 = function (symbolMin44100) {
            this._symbolMin44100 = symbolMin44100;
            return this;
        };

        PhysicalLayerBuilder.prototype.symbolMin48000 = function (symbolMin48000) {
            this._symbolMin48000 = symbolMin48000;
            return this;
        };

        PhysicalLayerBuilder.prototype.symbolMinDefault = function (symbolMinDefault) {
            this._symbolMinDefault = symbolMinDefault;
            return this;
        };

        PhysicalLayerBuilder.prototype.symbolRange = function (symbolRange) {
            this._symbolRange = symbolRange;
            return this;
        };

        PhysicalLayerBuilder.prototype.txAmplitude = function (txAmplitude) {
            this._txAmplitude = txAmplitude;
            return this;
        };

        PhysicalLayerBuilder.prototype.rxSymbolListener = function (listener) {
            this._rxSymbolListener = listener;
            return this;
        };

        PhysicalLayerBuilder.prototype.rxSyncStatusListener = function (listener) {
            this._rxSyncStatusListener = listener;
            return this;
        };

        PhysicalLayerBuilder.prototype.rxSampleDspDetailsListener = function (listener) {
            this._rxSampleDspDetailsListener = listener;
            return this;
        };

        PhysicalLayerBuilder.prototype.rxSyncDspDetailsListener = function (listener) {
            this._rxSyncDspDetailsListener = listener;
            return this;
        };

        PhysicalLayerBuilder.prototype.rxDspConfigListener = function (listener) {
            this._rxDspConfigListener = listener;
            return this;
        };

        PhysicalLayerBuilder.prototype.dspConfigListener = function (listener) {
            this._dspConfigListener = listener;
            return this;
        };

        PhysicalLayerBuilder.prototype.txSymbolListener = function (listener) {
            this._txSymbolListener = listener;
            return this;
        };

        PhysicalLayerBuilder.prototype.txSymbolProgressListener = function (listener) {
            this._txSymbolProgressListener = listener;
            return this;
        };

        PhysicalLayerBuilder.prototype.txDspConfigListener = function (listener) {
            this._txDspConfigListener = listener;
            return this;
        };

        PhysicalLayerBuilder.prototype.build = function () {
            return new PhysicalLayer(this);
        };

        return PhysicalLayerBuilder;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// TODO refactor needed - move data returned by listeners to separate classes

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.PhysicalLayer.PhysicalLayer', PhysicalLayer);

    PhysicalLayer.$inject = [
        'Rewrite.WebAudio.AudioMonoIO',
        'Rewrite.Util.SmartTimer',
        'Rewrite.PhysicalLayer.RxSyncDetector',
        'Rewrite.Dsp.FFTResult',
        'Rewrite.PhysicalLayer.TxSymbolManager'
    ];

    function PhysicalLayer(
        AudioMonoIO,
        SmartTimer,
        RxSyncDetector,
        FFTResult,
        TxSymbolManager
    ) {
        var PhysicalLayer;

        PhysicalLayer = function (builder) {
            // general config
            this.$$fftSize = builder._fftSize;
            this.$$audioMonoIO = new AudioMonoIO(this.$$fftSize);
            this.$$unitTime = builder._unitTime;
            this.$$smartTimer = new SmartTimer(this.$$unitTime);
            this.$$smartTimer.setListener(this.$$smartTimerListener.bind(this));
            this.$$fftSkipFactor = builder._fftSkipFactor;
            this.$$samplePerSymbol = builder._samplePerSymbol;
            this.$$symbolMin44100 = builder._symbolMin44100;
            this.$$symbolMin48000 = builder._symbolMin48000;
            this.$$symbolMinDefault = builder._symbolMinDefault;
            this.$$symbolRange = builder._symbolRange;
            this.$$rxSampleRate = this.$$audioMonoIO.getSampleRate();
            this.$$txAmplitude = builder._txAmplitude;
            this.$$correlationCode = builder._correlationCode.slice(0);
            this.$$rxSyncDetector = new RxSyncDetector(this.$$samplePerSymbol, this.$$correlationCode);
            this.$$rxSignalDecibelThresholdFactor = builder._rxSignalDecibelThresholdFactor;

            // state variables
            this.$$sampleNumber = PhysicalLayer.$$_INITIAL_SAMPLE_NUMER;
            this.$$sampleOffset = undefined;
            this.$$rxSymbolId = PhysicalLayer.$$_INITIAL_ID;
            this.$$rxSampleDspDetailsId = PhysicalLayer.$$_INITIAL_ID;
            this.$$rxSyncStatusId = PhysicalLayer.$$_INITIAL_ID;
            this.$$rxSymbol = undefined;
            this.$$rxSymbolRaw = undefined;
            this.$$rxSignalDecibel = undefined;
            this.$$rxSignalDecibelNextCandidate = undefined;
            this.$$rxNoiseDecibel = undefined;
            this.$$rxFrequencyData = undefined;
            this.$$isRxSyncInProgress = undefined;
            this.$$isRxSymbolSamplingPoint = undefined;
            this.$$rxSignalDecibelThreshold = PhysicalLayer.$$_INITIAL_RX_SIGNAL_DECIBEL_THRESHOLD;
            this.$$rxSyncDspDetailsLastId = undefined;
            this.$$txSymbolManager = new TxSymbolManager();

            // symbol ranges depends on sampleRate
            this.$$rxSymbolMin = this.$$getSymbolMin(this.$$rxSampleRate);
            this.$$rxSymbolMax = this.$$getSymbolMax(this.$$rxSampleRate);
            this.$$txSampleRate = undefined;
            this.$$txSymbolMin = undefined;
            this.$$txSymbolMax = undefined;
            this.setTxSampleRate(builder._txSampleRate);

            // setup listeners
            this.$$rxSymbolListener = PhysicalLayer.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
            this.$$rxSyncStatusListener = PhysicalLayer.$$isFunction(builder._rxSyncStatusListener) ? builder._rxSyncStatusListener : null;
            this.$$rxSampleDspDetailsListener = PhysicalLayer.$$isFunction(builder._rxSampleDspDetailsListener) ? builder._rxSampleDspDetailsListener : null;
            this.$$rxSyncDspDetailsListener = PhysicalLayer.$$isFunction(builder._rxSyncDspDetailsListener) ? builder._rxSyncDspDetailsListener : null;
            this.$$rxDspConfigListener = PhysicalLayer.$$isFunction(builder._rxDspConfigListener) ? builder._rxDspConfigListener : null;
            this.$$dspConfigListener = PhysicalLayer.$$isFunction(builder._dspConfigListener) ? builder._dspConfigListener : null;
            this.$$txSymbolListener = PhysicalLayer.$$isFunction(builder._txSymbolListener) ? builder._txSymbolListener : null;
            this.$$txSymbolProgressListener = PhysicalLayer.$$isFunction(builder._txSymbolProgressListener) ? builder._txSymbolProgressListener : null;
            this.$$txDspConfigListener = PhysicalLayer.$$isFunction(builder._txDspConfigListener) ? builder._txDspConfigListener : null;

            this.$$firstSmartTimerCall = true;
        };

        PhysicalLayer.MICROPHONE_MODE_ALWAYS_ON = 0;
        PhysicalLayer.MICROPHONE_MODE_AUTO_ON_OFF_WITH_GAP = 1;
        PhysicalLayer.$$_INITIAL_SAMPLE_NUMER = 0;
        PhysicalLayer.$$_INITIAL_ID = 0;   // will be incremented BEFORE first use
        PhysicalLayer.$$_INITIAL_RX_SIGNAL_DECIBEL_THRESHOLD = +Infinity;
        PhysicalLayer.$$_TX_AMPLITUDE_SILENT = 0;
        PhysicalLayer.$$_TX_FREQUENCY_ZERO = 0;
        PhysicalLayer.$$_FIRST_SYMBOL = 1;
        PhysicalLayer.$$_SYMBOL_SYNC_A_OFFSET = 1;
        PhysicalLayer.$$_SYMBOL_SYNC_B_OFFSET = 0;
        PhysicalLayer.$$_RX_SYMBOL_IDLE = null;
        PhysicalLayer.SYMBOL_IS_NOT_VALID_EXCEPTION = 'Symbol is not valid. Please pass number that is inside symbol range.';

        // -----------------------------------------

        PhysicalLayer.prototype.getRxSampleRate = function () {
            var rxDspConfig = this.getRxDspConfig();

            return rxDspConfig.rxSampleRate;
        };

        PhysicalLayer.prototype.txSync = function () {
            var i, correlationCodeValue, txFskSymbol, halfPlusOne;

            this.$$txSymbolManager.handleGapLogicAtStart();

            for (i = 0; i < this.$$correlationCode.length; i++) {
                correlationCodeValue = this.$$correlationCode[i];
                txFskSymbol = correlationCodeValue === -1
                    ? this.$$txSymbolMax - PhysicalLayer.$$_SYMBOL_SYNC_A_OFFSET
                    : this.$$txSymbolMax - PhysicalLayer.$$_SYMBOL_SYNC_B_OFFSET;
                this.$$txSymbolManager.addTxFskSymbol(txFskSymbol);
            }

            // TODO actually it should take into account the Correlator.THRESHOLD_UNIT value
            halfPlusOne = Math.ceil(this.$$correlationCode.length / 2) + 1;
            this.$$txSymbolManager.handleGapLogicAtEndOfSync(halfPlusOne);

            this.$$txSymbolProgressListener ? this.$$txSymbolProgressListener(this.getTxSymbolProgress()) : undefined;
        };

        PhysicalLayer.prototype.txSymbol = function (txSymbol) {
            var isNumber, txFskSymbolParsed, inRange, isValid, id;

            this.$$txSymbolManager.handleGapLogicAtStart();

            txFskSymbolParsed = parseInt(txSymbol);
            isNumber = typeof txFskSymbolParsed === 'number';
            inRange = this.$$txSymbolMin <= txFskSymbolParsed && txFskSymbolParsed <= this.$$txSymbolMax;
            isValid = isNumber && inRange;

            if (!isValid) {
                throw PhysicalLayer.SYMBOL_IS_NOT_VALID_EXCEPTION;
            }

            id = this.$$txSymbolManager.addTxFskSymbol(txFskSymbolParsed);

            this.$$txSymbolManager.handleGapLogicAtEnd();

            this.$$txSymbolProgressListener ? this.$$txSymbolProgressListener(this.getTxSymbolProgress()) : undefined;

            return id;
        };

        PhysicalLayer.prototype.setTxSampleRate = function (txSampleRate) {
            this.$$txSampleRate = txSampleRate;
            this.$$txSymbolMin = this.$$getSymbolMin(this.$$txSampleRate);
            this.$$txSymbolMax = this.$$getSymbolMax(this.$$txSampleRate);
            this.$$txSymbolManager.clearTxSymbolQueue();
            this.$$txSymbolProgressListener ? this.$$txSymbolProgressListener(this.getTxSymbolProgress()) : undefined;
            this.$$txDspConfigListener ? this.$$txDspConfigListener(this.getTxDspConfig()) : undefined;
        };

        PhysicalLayer.prototype.setLoopback = function (state) {
            this.$$audioMonoIO.setLoopback(state);
            this.$$dspConfigListener ? this.$$dspConfigListener(this.getDspConfig()) : undefined;
        };

        PhysicalLayer.prototype.setUnitTime = function (unitTime) {
            this.$$unitTime = unitTime;
            this.$$smartTimer.setInterval(unitTime);
            this.$$dspConfigListener ? this.$$dspConfigListener(this.getDspConfig()) : undefined;
        };

        PhysicalLayer.prototype.setTxAmplitude = function (txAmplitude) {
            this.$$txAmplitude = txAmplitude;
            this.$$txDspConfigListener ? this.$$txDspConfigListener(this.getTxDspConfig()) : undefined;
        };

        // -----------------------------------------

        PhysicalLayer.prototype.getRxSymbol = function () {
            return {
                id: this.$$rxSymbolId,
                rxSymbol: this.$$rxSymbol,
                rxSampleDspDetailsId: this.$$rxSampleDspDetailsId
            };
        };

        PhysicalLayer.prototype.getRxSyncStatus = function () {
            var rxSyncDspDetails = this.$$rxSyncDetector.getRxSyncDspDetails();

            return {
                id: this.$$rxSyncStatusId,
                isRxSyncInProgress: this.$$isRxSyncInProgress,
                isRxSyncOk: !!rxSyncDspDetails.id,
                rxSyncDspDetailsId: rxSyncDspDetails.id,
                rxSampleDspDetailsId: this.$$rxSampleDspDetailsId
            };
        };

        PhysicalLayer.prototype.getRxSampleDspDetails = function () {
            return {
                id: this.$$rxSampleDspDetailsId,
                rxSymbolRaw: this.$$rxSymbolRaw,
                rxSignalDecibel: this.$$rxSignalDecibel,
                // rxSignalDecibelNextCandidate: this.$$rxSignalDecibelNextCandidate,  // TODO add this at some point
                rxNoiseDecibel: this.$$rxNoiseDecibel,
                rxFrequencyData: this.$$rxFrequencyData.slice(0),
                isRxSymbolSamplingPoint: this.$$isRxSymbolSamplingPoint,
                rxSampleNumber: this.$$sampleNumber,
                rxSampleOffset: this.$$sampleOffset
            };
        };

        PhysicalLayer.prototype.getRxSyncDspDetails = function () {
            var rxSyncDspDetails = this.$$rxSyncDetector.getRxSyncDspDetails();

            return {
                id: rxSyncDspDetails.id,
                rxSymbolSamplingPointOffset: rxSyncDspDetails.rxSymbolSamplingPointOffset,
                rxCorrelationValue: rxSyncDspDetails.rxCorrelationValue,
                rxCorrelationCodeLength: rxSyncDspDetails.rxCorrelationCodeLength,
                rxSignalDecibelAverage: rxSyncDspDetails.rxSignalDecibelAverage,
                rxNoiseDecibelAverage: rxSyncDspDetails.rxNoiseDecibelAverage,
                rxSignalToNoiseRatio: rxSyncDspDetails.rxSignalToNoiseRatio
            };
        };

        PhysicalLayer.prototype.getRxDspConfig = function () {
            var rxSymbolFrequencySpacing = this.$$getFrequency(
                PhysicalLayer.$$_FIRST_SYMBOL,
                this.$$rxSampleRate
            );

            return {
                rxSampleRate: this.$$rxSampleRate,
                rxSymbolFrequencySpacing: rxSymbolFrequencySpacing,
                rxSymbolMin: this.$$rxSymbolMin,
                rxSymbolMax: this.$$rxSymbolMax,
                rxSignalDecibelThreshold: this.$$rxSignalDecibelThreshold,
                rxSignalDecibelThresholdFactor: this.$$rxSignalDecibelThresholdFactor
            };
        };

        PhysicalLayer.prototype.getDspConfig = function () {
            return {
                fftSkipFactor: this.$$fftSkipFactor,
                fftSize: this.$$fftSize,
                samplePerSymbol: this.$$samplePerSymbol,
                unitTime: this.$$unitTime,
                isLoopbackEnabled: this.$$audioMonoIO.isLoopbackEnabled()
            };
        };

        PhysicalLayer.prototype.getTxSymbol = function () {
            return this.$$txSymbolManager.getTxSymbol();
        };

        PhysicalLayer.prototype.getTxSymbolProgress = function () {
            return this.$$txSymbolManager.getTxSymbolProgress();
        };

        PhysicalLayer.prototype.getTxDspConfig = function () {
            var txSymbolFrequencySpacing = this.$$getFrequency(
                PhysicalLayer.$$_FIRST_SYMBOL,
                this.$$txSampleRate
            );

            return {
                txSampleRate: this.$$txSampleRate,
                txSymbolFrequencySpacing: txSymbolFrequencySpacing,
                txSymbolMin: this.$$txSymbolMin,
                txSymbolMax: this.$$txSymbolMax,
                txAmplitude: this.$$txAmplitude
            }
        };

        // -----------------------------------------

        PhysicalLayer.prototype.$$smartTimerListener = function () {
            if (this.$$firstSmartTimerCall) {
                this.$$rxDspConfigListener ? this.$$rxDspConfigListener(this.getRxDspConfig()) : undefined;
                this.$$dspConfigListener ? this.$$dspConfigListener(this.getDspConfig()) : undefined;
                this.$$txDspConfigListener ? this.$$txDspConfigListener(this.getTxDspConfig()) : undefined;
            }

            this.$$sampleOffset = this.$$sampleNumber % this.$$samplePerSymbol;
            this.$$rx();
            this.$$tx();

            this.$$sampleNumber++;

            this.$$firstSmartTimerCall = false;
        };

        PhysicalLayer.prototype.$$rx = function () {
            var
                isAllowedToListen,
                fftResult,
                rxSyncDspDetails,
                isNewSyncAvailable = false,
                isNewSymbolReadyToTake,
                fakeFrequencyData,
                i;

            this.$$rxSampleDspDetailsId++;
            this.$$rxSyncStatusId++;

            isAllowedToListen =
                this.$$txSymbolManager.getTxSymbolCurrent().isIdle() ||
                this.$$audioMonoIO.isLoopbackEnabled();

            if (isAllowedToListen) {
                fftResult = new FFTResult(this.$$audioMonoIO.getFrequencyData(), this.$$rxSampleRate);
                fftResult.downconvert(this.$$fftSkipFactor);
                this.$$rxFrequencyData = fftResult.getFrequencyData();
                this.$$rxSymbolRaw = fftResult.getLoudestBinIndexInBinRange(this.$$rxSymbolMin, this.$$rxSymbolMax);
                this.$$rxSignalDecibel = fftResult.getDecibel(this.$$rxSymbolRaw);
                this.$$rxSignalDecibelNextCandidate = -Infinity; // TODO add this at some point
                this.$$rxNoiseDecibel = fftResult.getDecibelAverage(this.$$rxSymbolMin, this.$$rxSymbolMax, this.$$rxSymbolRaw);
            } else {
                // TODO experiments - refactor this
                fakeFrequencyData = [];
                for (i = 0; i < this.$$fftSize * 0.5; i++) {
                    fakeFrequencyData.push(-160);
                }
                fftResult = new FFTResult(fakeFrequencyData, this.$$rxSampleRate);
                fftResult.downconvert(this.$$fftSkipFactor);
                this.$$rxFrequencyData = fftResult.getFrequencyData();
                this.$$rxSymbolRaw = this.$$rxSymbolMin;
                this.$$rxSignalDecibel = -Infinity;
                this.$$rxSignalDecibelNextCandidate = -Infinity;
                this.$$rxNoiseDecibel = -Infinity;
            }

            this.$$handleRxSync();

            this.$$isRxSyncInProgress = this.$$rxSyncDetector.isRxSyncInProgress();
            rxSyncDspDetails = this.$$rxSyncDetector.getRxSyncDspDetails();
            if (rxSyncDspDetails.id && rxSyncDspDetails.id !== this.$$rxSyncDspDetailsLastId) {
                this.$$rxSignalDecibelThreshold = rxSyncDspDetails.rxNoiseDecibelAverage +
                    this.$$rxSignalDecibelThresholdFactor * rxSyncDspDetails.rxSignalToNoiseRatio;
                this.$$rxSyncDspDetailsLastId = rxSyncDspDetails.id;
                isNewSyncAvailable = true;
            }

            this.$$isRxSymbolSamplingPoint = rxSyncDspDetails.id > 0 && this.$$sampleOffset === rxSyncDspDetails.rxSymbolSamplingPointOffset;
            isNewSymbolReadyToTake = this.$$isRxSymbolSamplingPoint && this.$$rxSignalDecibel > this.$$rxSignalDecibelThreshold;
            this.$$rxSymbol = isNewSymbolReadyToTake ? this.$$rxSymbolRaw : PhysicalLayer.$$_RX_SYMBOL_IDLE;

            // call listeners
            if (isNewSyncAvailable) {
                this.$$rxSyncDspDetailsListener ? this.$$rxSyncDspDetailsListener(this.getRxSyncDspDetails()) : undefined;
                this.$$rxDspConfigListener ? this.$$rxDspConfigListener(this.getRxDspConfig()) : undefined;
            }
            this.$$rxSampleDspDetailsListener ? this.$$rxSampleDspDetailsListener(this.getRxSampleDspDetails()) : undefined;
            this.$$rxSyncStatusListener ? this.$$rxSyncStatusListener(this.getRxSyncStatus()) : undefined;
            if (this.$$isRxSymbolSamplingPoint) {
                this.$$rxSymbolId++;
                this.$$rxSymbolListener ? this.$$rxSymbolListener(this.getRxSymbol()) : undefined;
            }
        };

        PhysicalLayer.prototype.$$tx = function () {
            var
                isFirstSampleOfBlock = this.$$sampleOffset === 0,
                isTxAboutToStart,
                isTxAboutToEnd;

            if (!isFirstSampleOfBlock) {
                return;
            }

            isTxAboutToStart = this.$$txSymbolManager.isTxAboutToStart();
            isTxAboutToEnd = this.$$txSymbolManager.isTxAboutToEnd();
            this.$$txSymbolManager.tick();

            if (isTxAboutToStart) {
                this.$$audioMonoIO.microphoneDisable(); // TODO experimental feature, this solves volume control problem on mobile browsers
                // console.log('microphone disable');
            }
            if (isTxAboutToEnd) {
                this.$$audioMonoIO.microphoneEnable();  // TODO experimental feature, this solves volume control problem on mobile browsers
                // console.log('microphone enable');
            }

            this.$$updateOscillator();

            this.$$txSymbolListener ? this.$$txSymbolListener(this.getTxSymbol()) : undefined;
            this.$$txSymbolProgressListener ? this.$$txSymbolProgressListener(this.getTxSymbolProgress()) : undefined;
        };

        // -------

        PhysicalLayer.prototype.$$handleRxSync = function () {
            var correlationCodeValue = null;

            switch (this.$$rxSymbolRaw) {
                case this.$$rxSymbolMax - PhysicalLayer.$$_SYMBOL_SYNC_A_OFFSET:
                    correlationCodeValue = -1;
                    break;
                case this.$$rxSymbolMax - PhysicalLayer.$$_SYMBOL_SYNC_B_OFFSET:
                    correlationCodeValue = 1;
                    break;
            }
            this.$$rxSyncDetector.handle(
                correlationCodeValue, this.$$rxSignalDecibel, this.$$rxNoiseDecibel
            );
        };

        PhysicalLayer.prototype.$$getSymbolMin = function (sampleRate) {
            switch (sampleRate) {
                case 44100:
                    return this.$$symbolMin44100;
                case 48000:
                    return this.$$symbolMin48000;
                default:
                    return this.$$symbolMinDefault;
            }
        };

        PhysicalLayer.prototype.$$getSymbolMax = function (sampleRate) {
            var symbolMin = this.$$getSymbolMin(sampleRate);

            return symbolMin + this.$$symbolRange - 1;
        };

        PhysicalLayer.prototype.$$updateOscillator = function () {
            var frequency, amplitude, isFsk, txSymbolCurrent;

            txSymbolCurrent = this.$$txSymbolManager.getTxSymbolCurrent();
            isFsk = txSymbolCurrent.isFsk();
            if (isFsk) {
                frequency = this.$$getFrequency(txSymbolCurrent.getTxFskSymbol(), this.$$txSampleRate);
                amplitude = this.$$txAmplitude;
            } else {
                frequency = PhysicalLayer.$$_TX_FREQUENCY_ZERO;
                amplitude = PhysicalLayer.$$_TX_AMPLITUDE_SILENT;
            }

            this.$$audioMonoIO.setPeriodicWave(frequency, amplitude);
        };

        PhysicalLayer.prototype.$$getFrequency = function (symbol, sampleRate) {
            var nativeFrequency = FFTResult.getFrequency(symbol, sampleRate, this.$$fftSize);

            return this.$$fftSkipFactor * nativeFrequency;
        };

        PhysicalLayer.$$isFunction = function (variable) {
            return typeof variable === 'function';
        };

        return PhysicalLayer;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.PhysicalLayer.RxSyncDetector', RxSyncDetector);

    RxSyncDetector.$inject = [
        'Rewrite.Dsp.Correlator'
    ];

    function RxSyncDetector(
        Correlator
    ) {
        var RxSyncDetector;

        RxSyncDetector = function (samplePerSymbol, correlationCode) {
            this.$$samplePerSymbol = samplePerSymbol;
            this.$$rxSyncInProgress = false;
            this.$$rxSyncDspDetails = RxSyncDetector.$$getEmpty();
            this.$$id = RxSyncDetector.$$_INITIAL_ID;
            this.$$correlator = new Correlator(samplePerSymbol, correlationCode);
            this.$$blockHistory = undefined;
            this.$$rxSampleNumber = RxSyncDetector.$$_INITIAL_RX_SAMPLE_NUMBER;

            this.$$initializeBlockHistory();
        };

        RxSyncDetector.$$_FIRST_ELEMENT = 0;
        RxSyncDetector.$$_INITIAL_ID = 1;
        RxSyncDetector.$$_INITIAL_RX_SAMPLE_NUMBER = 0;

        RxSyncDetector.prototype.isRxSyncInProgress = function () {
            return this.$$rxSyncInProgress;
        };

        RxSyncDetector.prototype.getRxSyncDspDetails = function () {
            return this.$$rxSyncDspDetails;
        };

        RxSyncDetector.prototype.handle = function (correlationCodeValue, signalDecibel, noiseDecibel) {
            var
                offset,
                blockHistoryEntry,
                isLastOffsetInSamplingBlock,
                syncDetected,
                syncJustUpdated,
                lastSyncDetected,
                syncCandidate;

            offset = this.$$rxSampleNumber % this.$$samplePerSymbol;
            blockHistoryEntry = this.$$blockHistory[offset];
            isLastOffsetInSamplingBlock = offset === (this.$$samplePerSymbol - 1);

            this.$$correlator.handle(correlationCodeValue, signalDecibel, noiseDecibel);
            syncDetected = this.$$correlator.isCorrelated();

            if (syncDetected) {
                syncCandidate = RxSyncDetector.$$getEmpty();    // TODO create dedicated class
                syncCandidate.rxSymbolSamplingPointOffset = offset;
                syncCandidate.rxCorrelationValue = this.$$correlator.getCorrelationValue();
                syncCandidate.rxCorrelationCodeLength = this.$$correlator.getCorrelationCodeLength();
                syncCandidate.rxSignalDecibelAverage = this.$$correlator.getSignalDecibelAverage();
                syncCandidate.rxNoiseDecibelAverage = this.$$correlator.getNoiseDecibelAverage();
                syncCandidate.rxSignalToNoiseRatio = this.$$correlator.getSignalToNoiseRatio();

                blockHistoryEntry.decisionList.push(syncCandidate);
            }
            lastSyncDetected = blockHistoryEntry.syncDetected;
            blockHistoryEntry.syncJustLost = lastSyncDetected && !syncDetected;
            blockHistoryEntry.syncDetected = syncDetected;

            if (isLastOffsetInSamplingBlock) {
                syncJustUpdated = this.$$tryToUpdateSync();
            }

            this.$$rxSyncInProgress =
                !syncJustUpdated &&
                this.$$isRxSyncInProgressInHistoryBlock();

            this.$$rxSampleNumber++;
        };

        RxSyncDetector.prototype.$$sortByCorrelationValue = function (a, b) {
            return a.rxCorrelationValue < b.rxCorrelationValue
                ? 1
                : (a.rxCorrelationValue > b.rxCorrelationValue ? -1 : 0);
        };

        RxSyncDetector.prototype.$$sortBySignalDecibel = function (a, b) {
            return a.rxSignalDecibelAverage < b.rxSignalDecibelAverage
                ? 1
                : (a.rxSignalDecibelAverage > b.rxSignalDecibelAverage ? -1 : 0);
        };

        RxSyncDetector.prototype.$$sortDecisionList = function (data) {
            var self = this;

            data.sort(function (a, b) {
                return 0 ||
                    self.$$sortByCorrelationValue(a, b) ||
                    self.$$sortBySignalDecibel(a, b);
            });
        };

        RxSyncDetector.prototype.$$initializeBlockHistory = function () {
            var offset;

            this.$$blockHistory = [];
            for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
                this.$$blockHistory.push({
                    decisionList: [],
                    syncJustLost: undefined,
                    syncDetected: undefined
                });
            }
        };

        RxSyncDetector.prototype.$$resetBlockHistory = function () {
            var offset, blockHistoryEntry;

            for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
                blockHistoryEntry = this.$$blockHistory[offset];
                blockHistoryEntry.decisionList.length = 0;
                blockHistoryEntry.syncJustLost = undefined;
                blockHistoryEntry.syncDetected = undefined;
            }
        };

        RxSyncDetector.prototype.$$getTheBestRxSyncDspDetails = function () {
            var offset, decisionList, innerDecisionList, strongestSync;

            decisionList = [];
            for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
                innerDecisionList = this.$$blockHistory[offset].decisionList;
                if (innerDecisionList.length > 0) {
                    this.$$sortDecisionList(innerDecisionList);
                    decisionList.push(innerDecisionList[RxSyncDetector.$$_FIRST_ELEMENT]);
                }
            }
            this.$$sortDecisionList(decisionList);
            strongestSync = decisionList[RxSyncDetector.$$_FIRST_ELEMENT];

            return strongestSync;
        };

        RxSyncDetector.prototype.$$updateSync = function () {
            this.$$rxSyncDspDetails = this.$$getTheBestRxSyncDspDetails();
            this.$$rxSyncDspDetails.id = this.$$id++;
            this.$$resetBlockHistory();
            this.$$correlator.reset();
        };

        RxSyncDetector.prototype.$$tryToUpdateSync = function () {
            var offset;

            for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
                if (this.$$blockHistory[offset].syncJustLost) {
                    this.$$updateSync();
                    return true;
                }
            }

            return false;
        };

        RxSyncDetector.prototype.$$isRxSyncInProgressInHistoryBlock = function () {
            var offset, blockHistoryEntry;

            for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
                blockHistoryEntry = this.$$blockHistory[offset];
                if (blockHistoryEntry.syncDetected || blockHistoryEntry.syncJustLost) {
                    return true;
                }
            }

            return false;
        };

        RxSyncDetector.$$getEmpty = function () {
            return {
                id: null,
                rxSymbolSamplingPointOffset: undefined,
                rxCorrelationValue: undefined,
                rxCorrelationCodeLength: undefined,
                rxSignalDecibelAverage: undefined,
                rxNoiseDecibelAverage: undefined,
                rxSignalToNoiseRatio: undefined
            };
        };

        return RxSyncDetector;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.PhysicalLayer.TxSymbolManager', TxSymbolManager);

    TxSymbolManager.$inject = [
        'Rewrite.PhysicalLayer.TxSymbol'
    ];

    function TxSymbolManager(
        TxSymbol
    ) {
        var TxSymbolManager;

        TxSymbolManager = function () {
            this.$$txSymbolId = 1;
            this.$$txSymbol = null;
            this.$$txSymbolCurrent = this.$$getTxSymbolIdle();
            this.$$txSymbolQueue = [];
        };

        TxSymbolManager.prototype.clearTxSymbolQueue = function () {
            this.$$txSymbolQueue.length = 0;
        };

        TxSymbolManager.prototype.getTxSymbol = function () {
            return this.$$txSymbol.cloneClean();
        };

        TxSymbolManager.prototype.getTxSymbolCurrent = function () {
            return this.$$txSymbolCurrent;
        };

        TxSymbolManager.prototype.getTxSymbolProgress = function () {
            var
                result = {},
                i;

            result.txSymbol = this.getTxSymbol();

            result.txSymbolCurrent = this.$$txSymbolCurrent.cloneClean();

            result.txSymbolQueue = [];
            for (i = 0; i < this.$$txSymbolQueue.length; i++) {
                result.txSymbolQueue.push(
                    this.$$txSymbolQueue[i].cloneClean()
                );
            }

            result.isTxInProgress = this.isTxInProgress();

            return result;
        };

        TxSymbolManager.prototype.isTxInProgress = function () {
            return this.$$txSymbolQueue.length > 0 ||
                this.$$txSymbolCurrent.isNotIdle();
        };

        TxSymbolManager.prototype.addTxFskSymbol = function (txFskSymbol) {
            var txSymbol = new TxSymbol(
                this.$$txSymbolId++,
                TxSymbol.TX_SYMBOL_FSK
            );

            txSymbol.setTxFskSymbol(txFskSymbol);
            this.$$txSymbolQueue.push(txSymbol);

            return txSymbol.getId();
        };

        TxSymbolManager.prototype.addTxSymbolGapImportant = function () {
            var txSymbolGapImportant = new TxSymbol(
                this.$$txSymbolId++,
                TxSymbol.TX_SYMBOL_GAP_IMPORTANT
            );
            this.$$txSymbolQueue.push(txSymbolGapImportant);
        };

        TxSymbolManager.prototype.addTxSymbolGapDeletable = function () {
            var txSymbolGapDeletable = new TxSymbol(
                this.$$txSymbolId++,
                TxSymbol.TX_SYMBOL_GAP_DELETABLE
            );
            this.$$txSymbolQueue.push(txSymbolGapDeletable);
        };

        TxSymbolManager.prototype.$$getTxSymbolIdle = function () {
            return new TxSymbol(
                this.$$txSymbolId++,
                TxSymbol.TX_SYMBOL_IDLE
            );
        };

        TxSymbolManager.prototype.isTxAboutToStart = function () {
            var isQueueNotEmpty = this.$$txSymbolQueue.length !== 0;

            return this.$$txSymbolCurrent.isIdle() && isQueueNotEmpty;
        };

        TxSymbolManager.prototype.isTxAboutToEnd = function () {
            var isQueueEmpty = this.$$txSymbolQueue.length === 0;

            return isQueueEmpty && this.$$txSymbolCurrent.isNotIdle();
        };

        TxSymbolManager.prototype.tick = function () {
            var txSymbolIdle, isQueueEmpty;

            isQueueEmpty = this.$$txSymbolQueue.length === 0;
            this.$$txSymbol = this.$$txSymbolCurrent;

            if (isQueueEmpty) {
                txSymbolIdle = this.$$getTxSymbolIdle();
                this.$$txSymbolCurrent = txSymbolIdle;
            } else {
                this.$$txSymbolCurrent = this.$$txSymbolQueue.shift();
            }
        };

        TxSymbolManager.prototype.handleGapLogicAtStart = function () {
            // When device A sends some data to device B
            // then device B cannot respond immediately. We
            // need make sure that device A will have some time
            // to reinitialize microphone again. This is solved
            // by adding two 'gap' symbols in the beginning
            // Similar problem we have at the end. If we enable
            // microphone at the same time as last symbol stops
            // then we have a glitch. We need to add one 'gap'
            // symbol after the last symbol.
            // If symbol is not last we need to remove that
            // unnecessary gap.
            if (this.isTxInProgress()) {
                this.$$clearAllDeletableGapFromTheEndOfTheQueue();
            } else {
                this.addTxSymbolGapDeletable();  // #1
                this.addTxSymbolGapDeletable();  // #2
            }
        };

        TxSymbolManager.prototype.handleGapLogicAtEnd = function () {
            // will be removed if subsequent symbol will arrive
            this.addTxSymbolGapDeletable();
        };

        TxSymbolManager.prototype.handleGapLogicAtEndOfSync = function (gapImportantNumber) {
            var i;

            for (i = 0; i < gapImportantNumber; i++) {
                this.addTxSymbolGapImportant();
            }
        };

        TxSymbolManager.prototype.$$clearAllDeletableGapFromTheEndOfTheQueue = function () {
            var i;

            for (i = this.$$txSymbolQueue.length - 1; i >= 0; i--) {
                if (this.$$txSymbolQueue[i].isNotGapDeletable()) {
                    this.$$txSymbolQueue.length = i + 1;
                    break;
                }
            }
        };

        return TxSymbolManager;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.PhysicalLayer.TxSymbol', TxSymbol);

    TxSymbol.$inject = [];

    function TxSymbol() {
        var TxSymbol;

        TxSymbol = function (id, type) {
            this.$$id = id;
            this.$$txSymbolType = type;
            this.$$txFskSymbol = null;
        };

        TxSymbol.TX_SYMBOL_IDLE = 'TX_SYMBOL_IDLE';
        TxSymbol.TX_SYMBOL_GAP_IMPORTANT = 'TX_SYMBOL_GAP_IMPORTANT';
        TxSymbol.TX_SYMBOL_GAP_DELETABLE = 'TX_SYMBOL_GAP_DELETABLE';
        TxSymbol.TX_SYMBOL_FSK = 'TX_SYMBOL_FSK';

        TxSymbol.prototype.setTxFskSymbol = function (txFskSymbol) {
            this.$$txFskSymbol = txFskSymbol;
        };

        TxSymbol.prototype.cloneClean = function () {
            return {
                id: this.$$id,
                txSymbolType: this.$$txSymbolType,
                txFskSymbol: this.$$txFskSymbol
            };
        };

        TxSymbol.prototype.isNotIdle = function () {
            return this.$$txSymbolType !== TxSymbol.TX_SYMBOL_IDLE;
        };

        TxSymbol.prototype.isIdle = function () {
            return this.$$txSymbolType === TxSymbol.TX_SYMBOL_IDLE;
        };

        TxSymbol.prototype.isFsk = function () {
            return this.$$txSymbolType === TxSymbol.TX_SYMBOL_FSK;
        };

        TxSymbol.prototype.isNotGapDeletable = function () {
            return this.$$txSymbolType !== TxSymbol.TX_SYMBOL_GAP_DELETABLE;
        };

        TxSymbol.prototype.getId = function () {
            return this.$$id;
        };

        TxSymbol.prototype.getTxFskSymbol = function () {
            return this.$$txFskSymbol;
        };

        return TxSymbol;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Util.Buffer', Buffer);

    Buffer.$inject = [];

    function Buffer() {
        var Buffer;

        Buffer = function (sizeMax) {
            this.$$data = [];
            this.$$positionStart = null;
            this.$$positionEnd = null;
            this.$$size = null;
            this.$$sizeMax = null;
            this.setSizeMax(sizeMax);
        };

        Buffer.prototype.clone = function () {
            var
                buffer = new Buffer(this.$$sizeMax),
                dataLength = this.$$data.length,
                i;

            buffer.$$positionStart = this.$$positionStart;
            buffer.$$positionEnd = this.$$positionEnd;
            buffer.$$size = this.$$size;

            for (i = 0; i < dataLength; i++) {
                buffer[i] = this.$$data[i];
            }

            return buffer;
        };

        Buffer.prototype.setSizeMax = function (sizeMax) {
            this.$$positionStart = 0;
            this.$$positionEnd = 0;
            this.$$size = 0;
            this.$$sizeMax = sizeMax;
            this.$$data.length = 0;        // drop all data
            this.$$data.length = sizeMax;
        };

        Buffer.prototype.push = function (value) {
            if (this.$$size === this.$$sizeMax) {
                return false;
            }

            this.$$data[this.$$positionEnd] = value;
            this.$$positionEnd = (this.$$positionEnd + 1) % this.$$sizeMax;
            this.$$size++;

            return true;
        };

        Buffer.prototype.pushEvenIfFull = function (value) {
            if (this.isFull()) {
                this.pop();
            }
            this.push(value);
        };

        Buffer.prototype.pop = function () {
            var result;

            if (this.$$size === 0) {
                return null;
            }
            result = this.$$data[this.$$positionStart];
            this.$$positionStart = (this.$$positionStart + 1) % this.$$sizeMax;
            this.$$size--;

            return result;
        };

        Buffer.prototype.getItem = function (index) {
            if (index >= this.$$size || index < 0) {
                return null;
            }

            return this.$$data[(this.$$positionStart + index) % this.$$sizeMax];
        };

        Buffer.prototype.getSize = function () {
            return this.$$size;
        };

        Buffer.prototype.getSizeMax = function () {
            return this.$$sizeMax;
        };

        Buffer.prototype.isFull = function () {
            return this.$$size === this.$$sizeMax;
        };

        Buffer.prototype.getAll = function () {
            var i, result = [];

            for (i = 0; i < this.getSize(); i++) {
                result.push(
                    this.getItem(i)
                );
            }

            return result;
        };

        Buffer.prototype.fillWith = function (value) {
            var i;

            for (i = 0; i < this.getSizeMax(); i++) {
                this.pushEvenIfFull(value);
            }
        };

        return Buffer;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Util.FrequencyCalculator', FrequencyCalculator);

    FrequencyCalculator.$inject = [];

    function FrequencyCalculator() {
        var FrequencyCalculator;

        FrequencyCalculator = function (sampleRateProvider, windowSizeProvider) {
            this.$$sampleRateProvider = sampleRateProvider ? sampleRateProvider : null;
            this.$$windowSizeProvider = windowSizeProvider ? windowSizeProvider : null;

            if (!this.$$sampleRateProvider || !this.$$windowSizeProvider) {
                throw FrequencyCalculator.PLEASE_SET_BOTH_PROVIDERS;
            }
        };

        FrequencyCalculator.PLEASE_SET_BOTH_PROVIDERS = 'Please set both providers';

        FrequencyCalculator.$$isFunction = function (variable) {
            return typeof variable === 'function';
        };

        FrequencyCalculator.prototype.getSamplePerPeriodFromHertz = function (hertz) {
            var sampleRate;

            sampleRate = FrequencyCalculator.$$isFunction(this.$$sampleRateProvider)
                ? this.$$sampleRateProvider()
                : this.$$sampleRateProvider;

            return sampleRate / hertz;
        };

        FrequencyCalculator.prototype.getHertzFromSamplePerPeriod = function (samplePerPeriod) {
            var sampleRate;

            sampleRate = FrequencyCalculator.$$isFunction(this.$$sampleRateProvider)
                ? this.$$sampleRateProvider()
                : this.$$sampleRateProvider;

            return sampleRate / samplePerPeriod;
        };

        FrequencyCalculator.prototype.getCyclePerWindowFromHertz = function (hertz) {
            var windowSize, sampleRate;

            windowSize = FrequencyCalculator.$$isFunction(this.$$windowSizeProvider)
                ? this.$$windowSizeProvider()
                : this.$$windowSizeProvider;
            sampleRate = FrequencyCalculator.$$isFunction(this.$$sampleRateProvider)
                ? this.$$sampleRateProvider()
                : this.$$sampleRateProvider;

            return hertz * windowSize / sampleRate;
        };

        FrequencyCalculator.prototype.getHertzFromCyclePerWindow = function (cyclePerWindow) {
            var windowSize, sampleRate;

            windowSize = FrequencyCalculator.$$isFunction(this.$$windowSizeProvider)
                ? this.$$windowSizeProvider()
                : this.$$windowSizeProvider;
            sampleRate = FrequencyCalculator.$$isFunction(this.$$sampleRateProvider)
                ? this.$$sampleRateProvider()
                : this.$$sampleRateProvider;

            return cyclePerWindow * sampleRate / windowSize;
        };

        FrequencyCalculator.prototype.getSamplePerPeriodFromCyclePerWindow = function (cyclePerWindow) {
            var windowSize;

            windowSize = FrequencyCalculator.$$isFunction(this.$$windowSizeProvider)
                ? this.$$windowSizeProvider()
                : this.$$windowSizeProvider;

            return windowSize / cyclePerWindow;
        };

        FrequencyCalculator.prototype.getCyclePerWindowFromSamplePerPeriod = function (samplePerPeriod) {
            var windowSize;

            windowSize = FrequencyCalculator.$$isFunction(this.$$windowSizeProvider)
                ? this.$$windowSizeProvider()
                : this.$$windowSizeProvider;

            return windowSize / samplePerPeriod;
        };

        return FrequencyCalculator;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// MusicCalculator class implements Scientific Pitch Notation:
// https://en.wikipedia.org/wiki/Scientific_pitch_notation

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Util.MusicCalculator', MusicCalculator);

    MusicCalculator.$inject = [];

    function MusicCalculator() {
        var MusicCalculator;

        MusicCalculator = function (a4Frequency) {
            this.$$a4Frequency = a4Frequency
                ? a4Frequency
                : MusicCalculator.A4_FREQUENCY_DEFAULT;
        };

        MusicCalculator.C4_A4_DELTA = 9; // semitoneNumber = 0 means middle C (C4)
        MusicCalculator.A4_FREQUENCY_DEFAULT = 440;
        MusicCalculator.SEMITONE_PER_OCTAVE = 12;
        MusicCalculator.OCTAVE_MIN = 0;
        MusicCalculator.OCTAVE_HOLDING_A4 = 4;
        MusicCalculator.OCTAVE_MAX = 10;
        MusicCalculator.NOTE_NAME_LIST = [
            'C',  // white key
            'C#', // black key
            'D',  // white key
            'D#', // black key
            'E',  // white key
            'F',  // white key
            'F#', // black key
            'G',  // white key
            'G#', // black key
            'A',  // white key
            'A#', // black key
            'B'   // white key
        ];

        MusicCalculator.prototype.getSemitoneNumber = function (frequency) {
            var
                logBase2,
                semitoneNumber;

            if (frequency <= 0) {
                return null;  // TODO throw exception
            }

            logBase2 = Math.log(frequency / this.$$a4Frequency) / Math.log(2);
            semitoneNumber = Math.round(
                MusicCalculator.SEMITONE_PER_OCTAVE * logBase2 + MusicCalculator.C4_A4_DELTA
            );

            MusicCalculator.$$checkSemitoneNumberRange(semitoneNumber);

            return semitoneNumber;
        };

        MusicCalculator.prototype.getFrequency = function (semitoneNumber) {
            var
                semitoneNumberA4based,
                exponent;

            MusicCalculator.$$checkSemitoneNumberRange(semitoneNumber);

            semitoneNumberA4based = semitoneNumber - MusicCalculator.C4_A4_DELTA;
            exponent = semitoneNumberA4based / MusicCalculator.SEMITONE_PER_OCTAVE;

            return this.$$a4Frequency * Math.pow(2, exponent);
        };

        MusicCalculator.prototype.getNoteName = function (semitoneNumber) {
            // alias of static method
            return MusicCalculator.getNoteName(semitoneNumber);
        };

        MusicCalculator.getNoteName = function (semitoneNumber) {
            var
                semitoneNumberC4,
                semitoneNumberC0Based,
                octaveNumber,
                semitoneIndexInOctave;

            MusicCalculator.$$checkSemitoneNumberRange(semitoneNumber);

            semitoneNumberC4 = MusicCalculator.OCTAVE_HOLDING_A4 * MusicCalculator.SEMITONE_PER_OCTAVE;
            semitoneNumberC0Based = semitoneNumberC4 + semitoneNumber;
            octaveNumber = Math.floor(semitoneNumberC0Based / MusicCalculator.SEMITONE_PER_OCTAVE);
            semitoneIndexInOctave = semitoneNumberC0Based % MusicCalculator.SEMITONE_PER_OCTAVE;

            return MusicCalculator.NOTE_NAME_LIST[semitoneIndexInOctave] + octaveNumber;
        };

        MusicCalculator.prototype.getFirstSemitoneNumber = function (semitoneNumber) {
            // alias of static method
            return MusicCalculator.getFirstSemitoneNumber(semitoneNumber);
        };

        MusicCalculator.getFirstSemitoneNumber = function (octaveNumber) {
            var octaveNumber4Based;

            if (octaveNumber < 0) {
                return null;  // TODO throw exception
            }

            octaveNumber4Based = octaveNumber - MusicCalculator.OCTAVE_HOLDING_A4;

            return octaveNumber4Based * MusicCalculator.SEMITONE_PER_OCTAVE;
        };

        MusicCalculator.$$checkSemitoneNumberRange = function (semitoneNumber) {
            // TODO check range and throw exception if needed
        };

        return MusicCalculator;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Util.SmartTimer', SmartTimer);

    SmartTimer.$inject = [];

    function SmartTimer() {
        var SmartTimer;

        SmartTimer = function (interval) {
            this.$$interval = null;
            this.$$intervalCounter = null;
            this.$$timeRefference = null;
            this.$$timeoutId = null;
            this.$$listener = undefined;

            this.setInterval(interval);
        };

        SmartTimer.$$_MILISECOND_IN_SECOND = 1000;

        SmartTimer.$$isFunction = function (variable) {
            return typeof variable === 'function';
        };

        SmartTimer.prototype.setInterval = function (interval) {
            if (this.$$timeoutId !== null) {
                clearTimeout(this.$$timeoutId);
            }
            this.$$interval = interval;
            this.$$intervalCounter = 0;
            this.$$timeRefference = new Date();
            this.$$scheduleNext();
        };

        SmartTimer.prototype.setListener = function (listener) {
            if (SmartTimer.$$isFunction(listener)) {
                this.$$listener = listener.bind(listener);
            } else {
                this.$$listener = null;
            }
        };

        SmartTimer.prototype.$$scheduleNext = function () {
            var
                scheduleDate = new Date(this.$$timeRefference),
                now = new Date(),
                millisecondsToAdd,
                difference;

            this.$$intervalCounter++;
            millisecondsToAdd = SmartTimer.$$_MILISECOND_IN_SECOND * this.$$interval * this.$$intervalCounter;
            scheduleDate.setMilliseconds(
                scheduleDate.getMilliseconds() + millisecondsToAdd
            );
            difference = scheduleDate.getTime() - now.getTime();

            this.$$timeoutId = setTimeout(
                this.$$notifyListener.bind(this),
                difference
            );
        };

        SmartTimer.prototype.$$notifyListener = function () {
            if (this.$$listener) {
                this.$$listener();
            }
            this.$$scheduleNext();
        };

        return SmartTimer;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// This file is inspirated by 'Recorderjs' developed by Matt Diamond
// https://github.com/mattdiamond/Recorderjs

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Util.WavAudioFile', WavAudioFile);

    WavAudioFile.$inject = [];

    function WavAudioFile() {
        var WavAudioFile;

        WavAudioFile = function () {
        };

        WavAudioFile.$$_MONO_CHANNEL_COUNT = 1;

        WavAudioFile.$$writeString = function (dataView, offset, string) {
            var i;

            for (i = 0; i < string.length; i++) {
                dataView.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        WavAudioFile.$$clipToUnit = function (value) {
            value = value < -1 ? -1 : value;
            value = value > 1 ? 1 : value;

            return value;
        };

        WavAudioFile.$$floatTo16BitPCM = function (output, offset, input) {
            var i, sample, sampleInt16;

            for (i = 0; i < input.length; i++) {
                sample = WavAudioFile.$$clipToUnit(input[i]);
                sampleInt16 = sample < 0
                    ? sample * 0x8000
                    : sample * 0x7FFF;
                output.setInt16(offset, sampleInt16, true);
                offset += 2;
            }
        };

        WavAudioFile.$$getObjectUrl = function (blob) {
            return (window.URL || window.webkitURL).createObjectURL(blob);
        };

        WavAudioFile.$$pad = function (number, size) {
            var s = '000000' + number;

            return s.substr(s.length - size);
        };

        WavAudioFile.getFilename = function () {
            var
                now = new Date(),
                filename;

            filename = '' +
                now.getFullYear() + '' +
                WavAudioFile.$$pad(now.getMonth() + 1, 2) + '' +
                WavAudioFile.$$pad(now.getDate(), 2) + '_' +
                WavAudioFile.$$pad(now.getHours(), 2) + '' +
                WavAudioFile.$$pad(now.getMinutes(), 2) + '' +
                WavAudioFile.$$pad(now.getSeconds(), 2) + '_' +
                WavAudioFile.$$pad(now.getMilliseconds(), 3) + '.wav';

            return filename;
        };

        WavAudioFile.getBlobUrl = function (buffer, sampleRate) {
            var
                arrayBuffer = new ArrayBuffer(44 + buffer.length * 2),
                dataView = new DataView(arrayBuffer),
                audioBlob;

            // RIFF identifier
            WavAudioFile.$$writeString(dataView, 0, 'RIFF');
            // RIFF chunk length
            dataView.setUint32(4, 36 + buffer.length * 2, true);
            // RIFF type
            WavAudioFile.$$writeString(dataView, 8, 'WAVE');
            // format chunk identifier
            WavAudioFile.$$writeString(dataView, 12, 'fmt ');
            // format chunk length
            dataView.setUint32(16, 16, true);
            // sample format (raw)
            dataView.setUint16(20, 1, true);
            // channel count
            dataView.setUint16(22, WavAudioFile.$$_MONO_CHANNEL_COUNT, true);
            // sample rate
            dataView.setUint32(24, sampleRate, true);
            // byte rate (sample rate * block align)
            dataView.setUint32(28, sampleRate * 4, true);
            // block align (channel count * bytes per sample)
            dataView.setUint16(32, WavAudioFile.$$_MONO_CHANNEL_COUNT * 2, true);
            // bits per sample
            dataView.setUint16(34, 16, true);
            // data chunk identifier
            WavAudioFile.$$writeString(dataView, 36, 'data');
            // data chunk length
            dataView.setUint32(40, buffer.length * 2, true);

            WavAudioFile.$$floatTo16BitPCM(dataView, 44, buffer);

            audioBlob = new Blob(
                [dataView],
                {type: 'audio/wav'}
            );

            return WavAudioFile.$$getObjectUrl(audioBlob);
        };

        return WavAudioFile;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

/**
 * Lite version of AudioMonoIO class. It wraps ScriptProcessorNode
 * only in order to provide RAW samples. So far only for mobile
 * device testing purposes.
 */
(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.WebAudio.AudioMonoIOLite', AudioMonoIOLite);

    AudioMonoIOLite.$inject = [];

    function AudioMonoIOLite() {
        var AudioMonoIOLite;

        AudioMonoIOLite = function (bufferSize) {
            this.$$audioContext = null;
            this.$$microphone = null;
            this.$$microphoneVirtual = null;
            this.$$sampleInProcessor = null;   // loopback was not working when we had one ScriptProcessor for IN and OUT
            this.$$sampleOutProcessor = null;
            this.$$volume = null;

            this.$$bufferSize = AudioMonoIOLite.$$getValueOrDefault(
                bufferSize,
                AudioMonoIOLite.BUFFER_SIZE
            );
            this.$$loopback = false;
            this.$$sampleInHandler = null;
            this.$$sampleOutHandler = null;

            this.$$initialize();
        };

        AudioMonoIOLite.$$firstInstance = true;

        AudioMonoIOLite.$$_MONO = 1;
        AudioMonoIOLite.$$_MONO_INDEX = 0;
        AudioMonoIOLite.$$_NO_CHANNEL = 0;

        AudioMonoIOLite.BUFFER_SIZE = 4 * 1024;

        AudioMonoIOLite.prototype.$$initialize = function () {
            this.$$normalizeBrowserApi();
            this.$$audioContext = this.$$createAudioContext();
            this.$$microphoneVirtual = this.$$audioContext.createGain();
            this.$$volume = this.$$audioContext.createGain();
            this.$$volume.connect(this.$$audioContext.destination);
        };

        AudioMonoIOLite.prototype.$$normalizeBrowserApi = function () {
            if (AudioMonoIOLite.$$firstInstance) {
                this.$$crossBrowserAudioContext();
                this.$$crossBrowserMediaDevices();
                AudioMonoIOLite.$$firstInstance = false;
            }
        };

        AudioMonoIOLite.prototype.$$crossBrowserAudioContext = function () {
            window.AudioContext =
                window.AudioContext ||
                window.webkitAudioContext ||
                window.mozAudioContext;
        };

        AudioMonoIOLite.prototype.$$crossBrowserMediaDevices = function () {
            var getUserMedia;

            // Code based on:
            // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

            if (navigator.mediaDevices === undefined) {
                navigator.mediaDevices = {};
            }
            if (navigator.mediaDevices.getUserMedia === undefined) {
                navigator.mediaDevices.getUserMedia = function (constraints) {
                    getUserMedia =
                        navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia;

                    if (!getUserMedia) {
                        return Promise.reject(
                            new Error('getUserMedia is not implemented in this browser')
                        );
                    }

                    return new Promise(function (resolve, reject) {
                        getUserMedia.call(navigator, constraints, resolve, reject);
                    });
                }
            }
        };

        AudioMonoIOLite.prototype.$$logAndRethrow = function (error, message) {
            alert(message);
            console.log(error);
            throw error;
        };

        AudioMonoIOLite.prototype.$$createAudioContext = function () {
            var audioContext;

            try {
                audioContext = new window.AudioContext();
            } catch (error) {
                this.$$logAndRethrow(error, 'AudioContext creation failed');
            }

            return audioContext;
        };

        AudioMonoIOLite.prototype.$$connectMicrophoneTo = function (node) {
            var
                self = this,
                constraints = {   // TODO investigate more on this
                    video: false,
                    audio: true
                };

            navigator.mediaDevices.getUserMedia(constraints)
                .then(function (stream) {
                    self.$$microphone = self.$$audioContext.createMediaStreamSource(stream);
                    self.$$microphone.connect(node);
                })
                .catch(function (error) {
                    self.$$logAndRethrow(error, 'Microphone initialization failed');
                });
        };

        AudioMonoIOLite.prototype.$$onAudioProcessInHandler = function (audioProcessingEvent) {
            var monoDataIn;

            if (AudioMonoIOLite.$$isFunction(this.$$sampleInHandler)) {
                monoDataIn = audioProcessingEvent
                    .inputBuffer
                    .getChannelData(AudioMonoIOLite.$$_MONO_INDEX);
                this.$$sampleInHandler(monoDataIn);
            }
        };

        AudioMonoIOLite.prototype.$$onAudioProcessOutHandler = function (audioProcessingEvent) {
            var monoDataOut;

            if (AudioMonoIOLite.$$isFunction(this.$$sampleOutHandler)) {
                monoDataOut = audioProcessingEvent
                    .outputBuffer
                    .getChannelData(AudioMonoIOLite.$$_MONO_INDEX);
                this.$$sampleOutHandler(monoDataOut);
            }
        };

        AudioMonoIOLite.$$isFunction = function (variable) {
            return typeof variable === 'function';
        };

        AudioMonoIOLite.$$getValueOrDefault = function (value, defaultValue) {
            return typeof value !== 'undefined' ? value : defaultValue;
        };

        AudioMonoIOLite.prototype.$$setImmediately = function (audioParam, value) {
            var now = this.$$audioContext.currentTime;

            audioParam.value = value;
            audioParam.setValueAtTime(value, now);
        };

        AudioMonoIOLite.prototype.setLoopback = function (state) {
            if (this.$$loopback === !!state) {
                return;
            }

            this.$$lazyLoadSampleInProcessor();

            if (this.$$loopback) {
                this.$$volume.disconnect(this.$$sampleInProcessor);
                this.$$volume.connect(this.$$audioContext.destination);
                this.$$microphoneVirtual.connect(this.$$sampleInProcessor);
            } else {
                this.$$microphoneVirtual.disconnect(this.$$sampleInProcessor);
                this.$$volume.disconnect(this.$$audioContext.destination);
                this.$$volume.connect(this.$$sampleInProcessor);
            }

            this.$$loopback = !!state;
        };

        AudioMonoIOLite.prototype.setVolume = function (volume) {
            this.$$setImmediately(this.$$volume.gain, volume);
        };

        AudioMonoIOLite.prototype.$$lazyLoadSampleInProcessor = function () {
            if (this.$$sampleInProcessor) {
                return;
            }

            this.$$sampleInProcessor = this.$$audioContext.createScriptProcessor(
                this.$$bufferSize,
                AudioMonoIOLite.$$_MONO,
                AudioMonoIOLite.$$_MONO  // required because of Chrome bug - should be set to zero
            );
            this.$$sampleInProcessor.onaudioprocess = this.$$onAudioProcessInHandler.bind(this);
            this.$$sampleInProcessor.connect(this.$$audioContext.destination); // required in Chrome
            this.$$microphoneVirtual.connect(this.$$sampleInProcessor);
            this.$$connectMicrophoneTo(this.$$microphoneVirtual);
        };

        AudioMonoIOLite.prototype.$$lazyLoadSampleOutProcessor = function () {
            if (this.$$sampleOutProcessor) {
                return;
            }

            this.$$sampleOutProcessor = this.$$audioContext.createScriptProcessor(
                this.$$bufferSize,
                AudioMonoIOLite.$$_NO_CHANNEL,
                AudioMonoIOLite.$$_MONO
            );
            this.$$sampleOutProcessor.onaudioprocess = this.$$onAudioProcessOutHandler.bind(this);
            this.$$sampleOutProcessor.connect(this.$$volume);
        };

        AudioMonoIOLite.prototype.setSampleInHandler = function (callback) {
            if (AudioMonoIOLite.$$isFunction(callback)) {
                this.$$lazyLoadSampleInProcessor();
                this.$$sampleInHandler = callback.bind(callback);
            } else {
                this.$$sampleInHandler = null;
            }
        };

        AudioMonoIOLite.prototype.setSampleOutHandler = function (callback) {
            if (AudioMonoIOLite.$$isFunction(callback)) {
                this.$$lazyLoadSampleOutProcessor();
                this.$$sampleOutHandler = callback.bind(callback);
            } else {
                this.$$sampleOutHandler = null;
            }
        };

        AudioMonoIOLite.prototype.getSampleRate = function () {
            return this.$$audioContext.sampleRate;
        };

        return AudioMonoIOLite;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// TODO: [bug] loopback is not working on Firefox

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.WebAudio.AudioMonoIO', AudioMonoIO);

    AudioMonoIO.$inject = [];

    function AudioMonoIO() {
        var AudioMonoIO;

        AudioMonoIO = function (fftSize, bufferSize, smoothingTimeConstant) {
            this.$$audioContext = null;
            this.$$microphoneStream = null;
            this.$$microphone = null;
            this.$$microphoneVirtual = null;
            this.$$masterIn = null;
            this.$$masterOut = null;
            this.$$masterOutVolume = null;

            this.$$sampleProcessor = null;  // TODO fix it: loopback is not working when we have one ScriptProcessor for IN and OUT

            this.$$inAnalyzer = null;
            this.$$outOscillator = null;
            this.$$outOscillatorGain = null;

            this.$$fftSize = AudioMonoIO.$$getValueOrDefault(
                fftSize,
                AudioMonoIO.FFT_SIZE
            );
            this.$$bufferSize = AudioMonoIO.$$getValueOrDefault(
                bufferSize,
                AudioMonoIO.BUFFER_SIZE
            );
            this.$$smoothingTimeConstant = AudioMonoIO.$$getValueOrDefault(
                smoothingTimeConstant,
                AudioMonoIO.SMOOTHING_TIME_CONSTANT
            );

            this.$$sampleInHandler = null;
            this.$$sampleOutHandler = null;

            this.$$loopbackEnabled = false;

            this.$$initialize();
        };

        AudioMonoIO.$$firstInstance = true;

        AudioMonoIO.$$_MONO = 1;
        AudioMonoIO.$$_MONO_INDEX = 0;

        // default values for setPeriodicWave method
        AudioMonoIO.$$_OUTPUT_WAVE_FREQUENCY = 0;
        AudioMonoIO.$$_OUTPUT_WAVE_VOLUME = 1;
        AudioMonoIO.$$_OUTPUT_WAVE_PHASE = 0;
        AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_AMPLITUDE = [ 1 ];
        AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_PHASE = [ 0 ];

        // default values for AudioMonoIO class constructor
        AudioMonoIO.FFT_SIZE = 2 * 1024;
        AudioMonoIO.BUFFER_SIZE = 4 * 1024;
        AudioMonoIO.SMOOTHING_TIME_CONSTANT = 0;

        AudioMonoIO.START_TIME_NEEDS_TO_GREATER_THAN_END_TIME_EXCEPTION = 'Start time needs to greater than end time';

        AudioMonoIO.prototype.$$normalizeBrowserApi = function () {
            if (AudioMonoIO.$$firstInstance) {
                this.$$crossBrowserAudioContext();
                this.$$crossBrowserMediaDevices();
                AudioMonoIO.$$firstInstance = false;
            }
        };

        AudioMonoIO.prototype.$$initialize = function () {
            this.$$normalizeBrowserApi();
            this.$$audioContext = this.$$createAudioContext();

            this.$$initializeCommon();
            this.$$initializeInput();
            this.$$initializeOutput();

            this.$$sourceAttach();
            this.$$masterOutVolume.connect(this.$$audioContext.destination);
        };

        AudioMonoIO.prototype.$$sourceDetach = function () {
            if (!this.$$loopbackEnabled) {
                this.$$microphoneVirtual.disconnect(this.$$masterIn);
            } else {
                this.$$masterOut.disconnect(this.$$masterIn);
            }
        };

        AudioMonoIO.prototype.$$sourceAttach = function () {
            if (!this.$$loopbackEnabled) {
                this.$$microphoneVirtual.connect(this.$$masterIn);
            } else {
                this.$$masterOut.connect(this.$$masterIn);
            }
        };

        AudioMonoIO.prototype.$$initializeCommon = function () {
            this.$$microphoneVirtual = this.$$audioContext.createGain();
            this.$$connectMicrophoneTo(this.$$microphoneVirtual);

            this.$$masterIn = this.$$audioContext.createGain();
            this.$$masterOut = this.$$audioContext.createGain();
            this.$$masterOutVolume = this.$$audioContext.createGain();

            this.$$sampleProcessor = this.$$audioContext.createScriptProcessor(
                this.$$bufferSize,
                AudioMonoIO.$$_MONO,
                AudioMonoIO.$$_MONO
            );
            this.$$sampleProcessor.onaudioprocess = this.$$onAudioProcessHandler.bind(this);

            this.$$masterIn.connect(this.$$sampleProcessor);
            this.$$sampleProcessor.connect(this.$$masterOut);
            this.$$masterOut.connect(this.$$masterOutVolume);
        };

        AudioMonoIO.prototype.$$initializeInput = function () {
            this.$$inAnalyzer = this.$$audioContext.createAnalyser();

            this.setFFTSize(this.$$fftSize);
            this.setSmoothingTimeConstant(this.$$smoothingTimeConstant);

            this.$$masterIn.connect(this.$$inAnalyzer);
        };

        AudioMonoIO.prototype.$$initializeOutput = function () {
            this.$$outOscillator = this.$$audioContext.createOscillator();
            this.$$outOscillatorGain = this.$$audioContext.createGain();

            this.setPeriodicWave(
                AudioMonoIO.$$_OUTPUT_WAVE_FREQUENCY,
                AudioMonoIO.$$_OUTPUT_WAVE_VOLUME,
                AudioMonoIO.$$_OUTPUT_WAVE_PHASE,
                AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_AMPLITUDE,
                AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_PHASE
            );
            this.$$outOscillator.start();

            this.$$outOscillator.connect(this.$$outOscillatorGain);
            this.$$outOscillatorGain.connect(this.$$masterOut);
        };

        AudioMonoIO.prototype.$$crossBrowserAudioContext = function () {
            window.AudioContext =
                window.AudioContext ||
                window.webkitAudioContext ||
                window.mozAudioContext;
        };

        AudioMonoIO.prototype.$$crossBrowserMediaDevices = function () {
            var getUserMedia;

            // Code based on:
            // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

            if (navigator.mediaDevices === undefined) {
                navigator.mediaDevices = {};
            }
            if (navigator.mediaDevices.getUserMedia === undefined) {
                navigator.mediaDevices.getUserMedia = function (constraints) {
                    getUserMedia =
                        navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia;

                    if (!getUserMedia) {
                        return Promise.reject(
                            new Error('getUserMedia is not implemented in this browser')
                        );
                    }

                    return new Promise(function (resolve, reject) {
                        getUserMedia.call(navigator, constraints, resolve, reject);
                    });
                }
            }
        };

        AudioMonoIO.prototype.$$logAndRethrow = function (error, message) {
            alert(message);
            console.log(error);
            throw error;
        };

        AudioMonoIO.prototype.$$createAudioContext = function () {
            var audioContext;

            try {
                audioContext = new window.AudioContext();
            } catch (error) {
                this.$$logAndRethrow(error, 'AudioContext creation failed');
            }

            return audioContext;
        };

        AudioMonoIO.prototype.$$resumeAudioContext = function () {
            if (this.$$audioContext.state === 'suspended') {
                this.$$audioContext.resume();
            }
        };

        AudioMonoIO.prototype.$$connectMicrophoneTo = function (node) {
            var
                self = this,
                constraints = {   // TODO investigate more on this
                    video: false,
                    audio: true/*{
                // channelCount: 1,
                // sampleRate: 44100,
                echoCancellation: true

                // mandatory: {},
                optional: {
                    googEchoCancellation: false, // disabling audio processing
                    googAutoGainControl: false,
                    googNoiseSuppression: false,
                    googHighpassFilter: false
                }

            }*/
                };

            /*
            console.log(
                navigator.mediaDevices.getSupportedConstraints()
            );
            */

            navigator.mediaDevices.getUserMedia(constraints)
                .then(function (stream) {
                    self.$$microphoneStream = stream;
                    self.$$microphone = self.$$audioContext.createMediaStreamSource(stream);
                    self.$$microphone.connect(node);
                })
                .catch(function (error) {
                    self.$$logAndRethrow(error, 'Microphone initialization failed');
                });
        };

        AudioMonoIO.prototype.$$onAudioProcessHandler = function (audioProcessingEvent) {
            var monoDataIn, monoDataOut;

            monoDataIn = audioProcessingEvent.inputBuffer.getChannelData(AudioMonoIO.$$_MONO_INDEX);
            monoDataOut = audioProcessingEvent.outputBuffer.getChannelData(AudioMonoIO.$$_MONO_INDEX);

            if (AudioMonoIO.$$isFunction(this.$$sampleInHandler)) {
                this.$$sampleInHandler(monoDataIn);
            }

            if (AudioMonoIO.$$isFunction(this.$$sampleOutHandler)) {
                this.$$sampleOutHandler(monoDataOut, monoDataIn);
            }
        };

        AudioMonoIO.prototype.$$setLinearly = function (audioParam, value, relativeStartTime, relativeEndTime) {
            var now = this.$$audioContext.currentTime;

            if (relativeStartTime >= relativeEndTime) {
                throw AudioMonoIO.START_TIME_NEEDS_TO_GREATER_THAN_END_TIME_EXCEPTION;
            }

            audioParam.setValueAtTime(audioParam.value, now + relativeStartTime);
            audioParam.linearRampToValueAtTime(
                value,
                now + relativeEndTime
            );
        };

        AudioMonoIO.prototype.$$setImmediately = function (audioParam, value) {
            var now = this.$$audioContext.currentTime;

            audioParam.value = value;
            audioParam.setValueAtTime(value, now);
        };

        AudioMonoIO.$$isFunction = function (variable) {
            return typeof variable === 'function';
        };

        AudioMonoIO.$$getValueOrDefault = function (value, defaultValue) {
            return typeof value !== 'undefined' ? value : defaultValue;
        };

        AudioMonoIO.prototype.microphoneDisable = function () {
            var tracks;

            // NOTE: experimental feature
            if (this.$$microphone) {
                this.$$microphone.disconnect(this.$$microphoneVirtual);
                this.$$microphone = null;
                if (this.$$microphoneStream && (typeof this.$$microphoneStream.getTracks === 'function')) {
                    tracks = this.$$microphoneStream.getTracks();
                    if (tracks && tracks.length > 0) {
                        if (typeof tracks[0].stop === 'function') {
                            tracks[0].stop();
                            this.$$microphoneStream = null;
                        }
                    }
                }
            }
        };

        AudioMonoIO.prototype.microphoneEnable = function () {
            // NOTE: experimental feature
            this.$$connectMicrophoneTo(this.$$microphoneVirtual);
        };

        AudioMonoIO.prototype.setVolume = function (volume) {
            this.$$setImmediately(this.$$masterOutVolume.gain, volume);
        };

        AudioMonoIO.prototype.isLoopbackEnabled = function () {
            return this.$$loopbackEnabled;
        };

        AudioMonoIO.prototype.setLoopback = function (state) {
            state = !!state;

            if (this.$$loopbackEnabled === state) {
                return false;
            }

            this.$$sourceDetach();
            this.$$loopbackEnabled = state;
            this.$$sourceAttach();

            return true;
        };

        AudioMonoIO.prototype.setPeriodicWaveFading = function (value, relativeStartTime, relativeEndTime) {
            this.$$setLinearly(this.$$outOscillatorGain.gain, value, relativeStartTime, relativeEndTime);
        };

        AudioMonoIO.prototype.setPeriodicWave = function (frequency, volume, phase, harmonicAmplitude, harmonicPhase) {
            var periodicWave, isPureSine;

            this.$$resumeAudioContext();

            isPureSine = typeof phase === 'undefined' &&
                typeof harmonicAmplitude === 'undefined' &&
                typeof harmonicPhase === 'undefined';

            frequency = AudioMonoIO.$$getValueOrDefault(
                frequency, AudioMonoIO.$$_OUTPUT_WAVE_FREQUENCY
            );
            volume = AudioMonoIO.$$getValueOrDefault(
                volume, AudioMonoIO.$$_OUTPUT_WAVE_VOLUME
            );

            if (volume || volume === 0) {
                this.$$setImmediately(this.$$outOscillatorGain.gain, volume);
            }
            if (frequency || frequency === 0) {
                this.$$setImmediately(this.$$outOscillator.frequency, frequency);
            }

            if (isPureSine) {
                this.$$outOscillator.type = 'sine';
            } else {
                phase = AudioMonoIO.$$getValueOrDefault(
                    phase, AudioMonoIO.$$_OUTPUT_WAVE_PHASE
                );
                harmonicAmplitude = AudioMonoIO.$$getValueOrDefault(
                    harmonicAmplitude, AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_AMPLITUDE
                );
                harmonicPhase = AudioMonoIO.$$getValueOrDefault(
                    harmonicPhase, AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_PHASE
                );

                periodicWave = this.$$getPeriodicWave(
                    phase,
                    harmonicAmplitude,
                    harmonicPhase
                );
                this.$$outOscillator.setPeriodicWave(periodicWave);
            }
        };

        AudioMonoIO.prototype.$$getPeriodicWave = function (phase, harmonicAmplitude, harmonicPhase) {
            var
                real,
                imag,
                harmonicNumber,
                i,
                phaseRadianGlobal,
                phaseRadianLocal,
                finalRadian;

            if (harmonicAmplitude.length !== harmonicPhase.length) {
                throw 'Length of amplitude and phase arrays should match';
            }
            if (harmonicAmplitude.length < 1) {
                throw 'Amplitude and phase arrays should have at least one item';
            }

            real = new Float32Array(1 + harmonicAmplitude.length);
            imag = new Float32Array(1 + harmonicAmplitude.length);
            phaseRadianGlobal = 2 * Math.PI * (-phase);
            real[0] = 0;   // DC-offset is always zero
            imag[0] = 0;
            for (i = 0; i < harmonicAmplitude.length; i++) {
                harmonicNumber = 1 + i;
                phaseRadianLocal = 2 * Math.PI * (-harmonicPhase[i]);
                finalRadian = phaseRadianGlobal * harmonicNumber + phaseRadianLocal;
                real[harmonicNumber] = harmonicAmplitude[i] * Math.sin(finalRadian);
                imag[harmonicNumber] = harmonicAmplitude[i] * Math.cos(finalRadian);
            }

            return this.$$audioContext.createPeriodicWave(real, imag);
        };

        AudioMonoIO.prototype.setSampleInHandler = function (callback) {
            if (AudioMonoIO.$$isFunction(callback)) {
                this.$$sampleInHandler = callback.bind(callback);
            } else {
                this.$$sampleInHandler = null;
            }
        };

        AudioMonoIO.prototype.setSampleOutHandler = function (callback) {
            if (AudioMonoIO.$$isFunction(callback)) {
                this.$$sampleOutHandler = callback.bind(callback);
            } else {
                this.$$sampleOutHandler = null;
            }
        };

        AudioMonoIO.prototype.setFFTSize = function (fftSize) {
            this.$$fftSize = fftSize;
            if (this.$$inAnalyzer.fftSize !== this.$$fftSize) {
                this.$$inAnalyzer.fftSize = this.$$fftSize;
            }
        };

        AudioMonoIO.prototype.getFFTSize = function () {
            return this.$$fftSize;
        };

        AudioMonoIO.prototype.setSmoothingTimeConstant = function (smoothingTimeConstant) {
            this.$$smoothingTimeConstant = smoothingTimeConstant;
            if (this.$$inAnalyzer.smoothingTimeConstant !== this.$$smoothingTimeConstant) {
                this.$$inAnalyzer.smoothingTimeConstant = this.$$smoothingTimeConstant;
            }
        };

        AudioMonoIO.prototype.getFrequencyData = function () {
            var data;

            this.$$resumeAudioContext();

            data = new Float32Array(this.$$inAnalyzer.frequencyBinCount);   // same as: 0.5 * fftSize
            this.$$inAnalyzer.getFloatFrequencyData(data);

            return data;
        };

        AudioMonoIO.prototype.getTimeDomainData = function () {
            var data;

            this.$$resumeAudioContext();

            data = new Float32Array(this.$$inAnalyzer.fftSize);
            this.$$inAnalyzer.getFloatTimeDomainData(data);

            return data;
        };

        AudioMonoIO.prototype.getSampleRate = function () {
            return this.$$audioContext.sampleRate;
        };

        AudioMonoIO.prototype.getFFTResolution = function () {
            return this.getSampleRate() / audioMonoIO.getFFTSize()
        };

        return AudioMonoIO;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.DataLinkLayer.ChecksumService', ChecksumService);

    ChecksumService.$inject = [];

    function ChecksumService() {
        var ChecksumService;

        ChecksumService = function () {
        };

        ChecksumService.fletcher8 = function (data) {
            var sum0, sum1, i, isLeftHalfOfByte, byteNumber, byte, halfOfByte;

            sum0 = 0;
            sum1 = 0;
            for (i = 0; i < 2 * data.length; i++) {
                isLeftHalfOfByte = i % 2 === 0;
                byteNumber = i >>> 1;
                byte = data[byteNumber];
                halfOfByte = isLeftHalfOfByte
                    ? (byte & 0xF0) >>> 4
                    : byte & 0x0F;
                sum0 = (sum0 + halfOfByte) % 0x0F;
                sum1 = (sum1 + sum0) % 0x0F;
            }

            return (sum1 << 4) | sum0;
        };

        return ChecksumService;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.DataLinkLayer.DataLinkLayerBuilder', DataLinkLayerBuilder);

    DataLinkLayerBuilder.$inject = [
        'Rewrite.DataLinkLayer.DataLinkLayer'
    ];

    function DataLinkLayerBuilder(
        DataLinkLayer
    ) {
        var DataLinkLayerBuilder;

        DataLinkLayerBuilder = function () {
            this._framePayloadLengthLimit = 7;

            // data link layer listeners
            this._rxFrameListener = undefined;
            this._rxFrameCandidateListener = undefined;
            this._txFrameListener = undefined;
            this._txFrameProgressListener = undefined;

            // physical layer listeners
            this._rxSymbolListener = undefined;
            this._rxSampleDspDetailsListener = undefined;
            this._rxSyncDspDetailsListener = undefined;
            this._rxDspConfigListener = undefined;
            this._dspConfigListener = undefined;
            this._txSymbolProgressListener = undefined;
            this._txDspConfigListener = undefined;
        };

        DataLinkLayerBuilder.prototype.framePayloadLengthLimit = function (framePayloadLengthLimit) {
            this._framePayloadLengthLimit = framePayloadLengthLimit;
            return this;
        };

        DataLinkLayerBuilder.prototype.rxFrameListener = function (listener) {
            this._rxFrameListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.txFrameListener = function (listener) {
            this._txFrameListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.txFrameProgressListener = function (listener) {
            this._txFrameProgressListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.rxFrameCandidateListener = function (listener) {
            this._rxFrameCandidateListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.rxSymbolListener = function (listener) {
            this._rxSymbolListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.rxSampleDspDetailsListener = function (listener) {
            this._rxSampleDspDetailsListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.rxSyncStatusListener = function (listener) {
            this._rxSyncStatusListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.rxSyncDspDetailsListener = function (listener) {
            this._rxSyncDspDetailsListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.rxDspConfigListener = function (listener) {
            this._rxDspConfigListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.dspConfigListener = function (listener) {
            this._dspConfigListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.txSymbolListener = function (listener) {
            this._txSymbolListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.txSymbolProgressListener = function (listener) {
            this._txSymbolProgressListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.txDspConfigListener = function (listener) {
            this._txDspConfigListener = listener;
            return this;
        };

        DataLinkLayerBuilder.prototype.build = function () {
            return new DataLinkLayer(this);
        };

        return DataLinkLayerBuilder;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// TODO move and refactor RX code (dedicated classes like in TX part)
// TODO implement solution what will not require PhysicalLayer synchronization (looking for frames in two FSK symbol streams)

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.DataLinkLayer.DataLinkLayer', DataLinkLayer);

    DataLinkLayer.$inject = [
        'Rewrite.PhysicalLayer.PhysicalLayerBuilder',
        'Rewrite.DataLinkLayer.TxFrameManager',
        'Rewrite.DataLinkLayer.TxFrame',
        'Rewrite.DataLinkLayer.ChecksumService'
    ];

    function DataLinkLayer(
        PhysicalLayerBuilder,
        TxFrameManager,
        TxFrame,
        ChecksumService
    ) {
        var DataLinkLayer;

        DataLinkLayer = function (builder) {
            // let's create network stack!
            // Data Link Layer hides Physical Layer inside
            this.$$physicalLayer = (new PhysicalLayerBuilder())
                .rxSymbolListener(this.$$rxSymbolListener.bind(this))
                .rxSampleDspDetailsListener(builder._rxSampleDspDetailsListener)
                .rxSyncStatusListener(builder._rxSyncStatusListener)
                .rxSyncDspDetailsListener(builder._rxSyncDspDetailsListener)
                .rxDspConfigListener(builder._rxDspConfigListener)
                .dspConfigListener(builder._dspConfigListener)
                .txSymbolListener(this.$$txSymbolListener.bind(this))
                .txSymbolProgressListener(builder._txSymbolProgressListener)
                .txDspConfigListener(builder._txDspConfigListener)
                .build();

            // general config
            this.$$framePayloadLengthLimit = builder._framePayloadLengthLimit;

            // state variables
            this.$$frame = undefined;
            this.$$frameId = DataLinkLayer.$$_INITIAL_ID;
            this.$$frameCandidateId = DataLinkLayer.$$_INITIAL_ID;
            this.$$frameCandidateList = [];
            this.$$txFrameManager = new TxFrameManager();

            // setup listeners - data link layer
            this.$$rxFrameListener = DataLinkLayer.$$isFunction(builder._rxFrameListener) ? builder._rxFrameListener : null;
            this.$$rxFrameCandidateListener = DataLinkLayer.$$isFunction(builder._rxFrameCandidateListener) ? builder._rxFrameCandidateListener : null;
            this.$$txFrameListener = DataLinkLayer.$$isFunction(builder._txFrameListener) ? builder._txFrameListener : null;
            this.$$txFrameProgressListener = DataLinkLayer.$$isFunction(builder._txFrameProgressListener) ? builder._txFrameProgressListener : null;

            // setup listeners - physical layer
            this.$$externalRxSymbolListener = DataLinkLayer.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
            this.$$externalTxSymbolListener = DataLinkLayer.$$isFunction(builder._txSymbolListener) ? builder._txSymbolListener : null;
        };

        DataLinkLayer.PAYLOAD_TO_BIG_EXCEPTION = 'Payload is too big!';

        DataLinkLayer.COMMAND_TWO_WAY_SYNC_44100 = 0;
        DataLinkLayer.COMMAND_TWO_WAY_SYNC_48000 = 1;

        DataLinkLayer.$$_HEADER_FRAME_START_MARKER = 0xE0;
        DataLinkLayer.$$_HEADER_RESERVED_BIT = 0x08;
        DataLinkLayer.$$_HEADER_COMMAND_BIT_SET = 0x10;
        DataLinkLayer.$$_HEADER_COMMAND_BIT_NOT_SET = 0x00;
        DataLinkLayer.$$_HEADER_PAYLOAD_LENGTH_MASK = 0x0F;
        DataLinkLayer.$$_ONE_BYTE_MASK = 0xFF;

        DataLinkLayer.$$_PAYLOAD_TYPE_COMMAND = 'PAYLOAD_TYPE_COMMAND';
        DataLinkLayer.$$_PAYLOAD_TYPE_DATA = 'PAYLOAD_TYPE_DATA';

        DataLinkLayer.$$_INITIAL_ID = 1;
        DataLinkLayer.$$_HEADER_AND_CHECKSUM_BYTE_OVERHEAD = 2;

        DataLinkLayer.prototype.getPhysicalLayer = function () {
            return this.$$physicalLayer;
        };

        DataLinkLayer.prototype.getRxSampleRate = function () {
            var rxDspConfig = this.$$physicalLayer.getRxDspConfig();

            return rxDspConfig.rxSampleRate;
        };

        DataLinkLayer.prototype.setTxSampleRate = function (txSampleRate) {
            this.$$physicalLayer.setTxSampleRate(txSampleRate);  // alias for easier access
        };

        DataLinkLayer.prototype.txSync = function () {
            this.$$physicalLayer.txSync();  // alias for easier access
        };

        DataLinkLayer.prototype.txTwoWaySync = function () {
            var isCommand = true;

            this.txSync();
            switch (this.getRxSampleRate()) {
                case 44100:
                    this.txFrame([DataLinkLayer.COMMAND_TWO_WAY_SYNC_44100], isCommand);
                    break;
                case 48000:
                    this.txFrame([DataLinkLayer.COMMAND_TWO_WAY_SYNC_48000], isCommand);
                    break;
            }
        };

        DataLinkLayer.prototype.setLoopback = function (state) {
            this.$$physicalLayer.setLoopback(state);  // alias for easier access
        };

        DataLinkLayer.prototype.getFramePayloadLengthLimit = function () {
            return this.$$framePayloadLengthLimit;
        };

        DataLinkLayer.prototype.txFrame = function (txFramePayload, isTxFrameCommand) {
            var txFrame, txDspConfig, txSymbolMin, i, txByte, txSymbol, txSymbolId;

            if (txFramePayload.length > this.$$framePayloadLengthLimit) {
                throw DataLinkLayer.PAYLOAD_TO_BIG_EXCEPTION;
            }

            txFrame = new TxFrame(
                this.$$txFrameManager.getNextTxFrameId(),
                txFramePayload,
                isTxFrameCommand
            );

            txDspConfig = this.$$physicalLayer.getTxDspConfig();
            txSymbolMin = txDspConfig.txSymbolMin;
            for (i = 0; i < txFrame.getTxByteLength(); i++) {
                txByte = txFrame.getTxByte(i);
                txSymbol = txSymbolMin + txByte;
                txSymbolId = this.$$physicalLayer.txSymbol(txSymbol);
                txFrame.addTxSymbolId(txSymbolId);
            }

            this.$$txFrameManager.addTxFrame(txFrame);

            this.$$txFrameProgressListener ? this.$$txFrameProgressListener(this.getTxFrameProgress()) : undefined;

            return txFrame.getId();
        };

        DataLinkLayer.prototype.getTxFrame = function () {
            return this.$$txFrameManager.getTxFrameCloned();
        };

        DataLinkLayer.prototype.getTxFrameProgress = function () {
            return this.$$txFrameManager.getTxFrameProgressCloned();
        };

        DataLinkLayer.prototype.getRxFrame = function () {
            var
                frame = this.$$frame,
                frameCopy;

            if (!frame) {
                return null;
            }

            frameCopy = {
                id: frame.id,
                header: frame.rxFrameHeader,
                pyload: frame.rxFramePayload.slice(0),
                checksum: frame.rxFrameChecksum,
                isCommand: frame.isRxFrameCommand,
                rxFrameCandidateId: frame.rxFrameCandidateId
            };

            return frameCopy;
        };

        DataLinkLayer.prototype.getRxFrameCandidate = function () {
            var i, frameCandidate, frameCandidateCopy, result = [];

            for (i = 0; i < this.$$frameCandidateList.length; i++) {
                frameCandidate = this.$$frameCandidateList[i];
                frameCandidateCopy = {
                    id: frameCandidate.id,
                    byteReceived: frameCandidate.rxByteReceived.slice(0),
                    byteExpected: frameCandidate.rxByteExpected,
                    unitProgress: frameCandidate.rxByteReceived.length / frameCandidate.rxByteExpected,
                    isFullyReceived: frameCandidate.rxByteReceived.length === frameCandidate.rxByteExpected,
                    isValid: frameCandidate.isRxFrameCandidateValid,
                    rxSampleDspDetailsId: frameCandidate.rxSampleDspDetailsId.slice(0)
                };
                result.push(frameCandidateCopy);
            }

            return result;
        };

        // -----------------------------------------------------

        DataLinkLayer.prototype.$$handleRxSymbol = function (data) {
            var
                rxSampleDspDetails = this.$$physicalLayer.getRxSampleDspDetails(),
                rxDspConfig = this.$$physicalLayer.getRxDspConfig(),
                rxSymbolMin = rxDspConfig.rxSymbolMin,
                byte = (rxSampleDspDetails.rxSymbolRaw - rxSymbolMin) & DataLinkLayer.$$_ONE_BYTE_MASK,
                rxSampleDspDetailsId = rxSampleDspDetails.id,
                isNewFrameAvailable,
                command;

            this.$$cleanUpFrameCandidateList();
            this.$$addNewByteToFrameCandidateList(byte, rxSampleDspDetailsId);
            this.$$tryToCreateNewFrameCandidate(byte, rxSampleDspDetailsId);
            isNewFrameAvailable = this.$$tryToFindNewFrame();

            // call listeners
            this.$$rxFrameCandidateListener ? this.$$rxFrameCandidateListener(this.getRxFrameCandidate()) : undefined;
            if (isNewFrameAvailable) {
                if (this.$$frame.isRxFrameCommand) {
                    command = this.$$frame.rxFramePayload[0];
                    this.$$handleReceivedCommand(command);
                }
                this.$$rxFrameListener ? this.$$rxFrameListener(this.getRxFrame()) : undefined;
            }
        };

        DataLinkLayer.prototype.$$handleTxSymbol = function (data) {
            var txSymbolId, txFrameCloned;

            txSymbolId = data.id;
            this.$$txFrameManager.handleTxSymbolId(txSymbolId);

            txFrameCloned = this.$$txFrameManager.getTxFrameCloned();
            if (txFrameCloned) {
                this.$$txFrameListener ? this.$$txFrameListener(txFrameCloned) : undefined;
            }
            this.$$txFrameProgressListener ? this.$$txFrameProgressListener(this.getTxFrameProgress()) : undefined;
        };

        DataLinkLayer.prototype.$$cleanUpFrameCandidateList = function () {
            var i, frameCandidate, receivedFully;

            for (i = this.$$frameCandidateList.length - 1; i >= 0; i--) {
                frameCandidate = this.$$frameCandidateList[i];
                receivedFully = frameCandidate.rxByteReceived.length === frameCandidate.rxByteExpected;
                if (receivedFully) {
                    this.$$frameCandidateList.splice(i, 1);
                }
            }
        };

        DataLinkLayer.prototype.$$addNewByteToFrameCandidateList = function (byte, rxSampleDspDetailsId) {
            var i, frameCandidate, readyToComputeChecksum, fullyReceived, notFullyReceived, frameWithoutChecksum, rxChecksum;

            for (i = 0; i < this.$$frameCandidateList.length; i++) {
                frameCandidate = this.$$frameCandidateList[i];
                notFullyReceived = frameCandidate.rxByteReceived.length < frameCandidate.rxByteExpected;
                if (notFullyReceived) {
                    frameCandidate.rxByteReceived.push(byte);
                    frameCandidate.rxSampleDspDetailsId.push(rxSampleDspDetailsId);
                }

                readyToComputeChecksum = frameCandidate.rxByteReceived.length === (frameCandidate.rxByteExpected - 1);
                if (readyToComputeChecksum) {
                    frameWithoutChecksum = frameCandidate.rxByteReceived;
                    frameCandidate.rxChecksumExpected = ChecksumService.fletcher8(frameWithoutChecksum);
                }

                fullyReceived = frameCandidate.rxByteReceived.length === frameCandidate.rxByteExpected;
                if (fullyReceived) {
                    rxChecksum = frameCandidate.rxByteReceived[frameCandidate.rxByteReceived.length - 1];
                    frameCandidate.isRxFrameCandidateValid = frameCandidate.rxChecksumExpected === rxChecksum;
                }
            }
        };

        DataLinkLayer.prototype.$$tryToCreateNewFrameCandidate = function (byte, rxSampleDspDetailsId) {
            var frameCandidate, header, payloadLength;

            if (!DataLinkLayer.$$isValidHeader(byte)) {
                return;
            }
            header = byte;
            payloadLength = DataLinkLayer.$$getPayloadLength(header);

            frameCandidate = {
                id: this.$$frameCandidateId++,
                rxByteReceived: [header],
                rxByteExpected: payloadLength + DataLinkLayer.$$_HEADER_AND_CHECKSUM_BYTE_OVERHEAD,
                isRxFrameCandidateValid: false,
                rxChecksumExpected: null,
                rxSampleDspDetailsId: [rxSampleDspDetailsId]
            };
            this.$$frameCandidateList.push(frameCandidate);
        };

        DataLinkLayer.prototype.$$tryToFindNewFrame = function () {
            var i, frameCandidate;

            for (i = 0; i < this.$$frameCandidateList.length; i++) {
                frameCandidate = this.$$frameCandidateList[i];
                if (frameCandidate.isRxFrameCandidateValid) {
                    this.$$frame = DataLinkLayer.$$getRxFrameFromFrameCandidate(frameCandidate, this.$$frameId++);
                    // there is possibility that there are more valid frames
                    // but the assumption is that we are picking the biggest one only
                    return true;
                }
            }

            return false;
        };

        DataLinkLayer.prototype.$$handleReceivedCommand = function (command) {
            switch (command) {
                case DataLinkLayer.COMMAND_TWO_WAY_SYNC_44100:
                    this.setTxSampleRate(44100);
                    this.txSync();
                    break;
                case DataLinkLayer.COMMAND_TWO_WAY_SYNC_48000:
                    this.setTxSampleRate(48000);
                    this.txSync();
                    break;
            }
        };

        // -----------------------------------------------------

        DataLinkLayer.prototype.$$txSymbolListener = function (data) {
            this.$$externalTxSymbolListener ? this.$$externalTxSymbolListener(data) : undefined;
            this.$$handleTxSymbol(data);
        };

        DataLinkLayer.prototype.$$rxSymbolListener = function (data) {
            this.$$externalRxSymbolListener ? this.$$externalRxSymbolListener(data) : undefined;
            this.$$handleRxSymbol(data);
        };

        // -----------------------------------------------------

        DataLinkLayer.$$getRxFrameFromFrameCandidate = function (frameCandidate, frameId) {
            var frame, rxFrameHeader;

            rxFrameHeader = frameCandidate.rxByteReceived[0];
            frame = {
                id: frameId,
                rxFrameHeader: rxFrameHeader,
                rxFramePayload: frameCandidate.rxByteReceived.slice(1, frameCandidate.rxByteReceived.length - 1),
                rxFrameChecksum: frameCandidate.rxByteReceived[frameCandidate.rxByteReceived.length - 1],
                isRxFrameCommand: DataLinkLayer.$$getIsCommand(rxFrameHeader),
                rxFrameCandidateId: frameCandidate.id
            };

            return frame;
        };

        DataLinkLayer.$$buildFrame = function (payloadType, payload) { // TODO refactor needed as we have dedicated Frame class
            var frame, isCommand, header, checksum, i, byte;

            frame = [];
            isCommand = payloadType === DataLinkLayer.$$_PAYLOAD_TYPE_COMMAND;
            header = DataLinkLayer.$$getHeader(isCommand, payload.length);
            frame.push(header);
            for (i = 0; i < payload.length; i++) {
                byte = payload[i] & DataLinkLayer.$$_ONE_BYTE_MASK;
                frame.push(byte);
            }
            checksum = ChecksumService.fletcher8(frame);
            frame.push(checksum);

            return frame;
        };

        DataLinkLayer.$$getHeader = function (isCommand, payloadLength) { // TODO refactor needed as we have dedicated Frame class
            var header, frameStartMarker, commandBit;

            frameStartMarker = DataLinkLayer.$$_HEADER_FRAME_START_MARKER;
            commandBit = isCommand
                ? DataLinkLayer.$$_HEADER_COMMAND_BIT_SET
                : DataLinkLayer.$$_HEADER_COMMAND_BIT_NOT_SET;
            payloadLength = DataLinkLayer.$$_HEADER_PAYLOAD_LENGTH_MASK & payloadLength;

            header = frameStartMarker | commandBit | payloadLength;

            return header;
        };

        DataLinkLayer.$$isValidHeader = function (byte) { // TODO refactor needed as we have dedicated Frame class
            var frameStartMarkerAvailable, reservedBitNotSet;

            frameStartMarkerAvailable = (DataLinkLayer.$$_HEADER_FRAME_START_MARKER & byte) === DataLinkLayer.$$_HEADER_FRAME_START_MARKER;
            reservedBitNotSet = !(DataLinkLayer.$$_HEADER_RESERVED_BIT & byte);

            return frameStartMarkerAvailable && reservedBitNotSet;
        };

        DataLinkLayer.$$getPayloadLength = function (header) { // TODO refactor needed as we have dedicated Frame class
            return header & DataLinkLayer.$$_HEADER_PAYLOAD_LENGTH_MASK;
        };

        DataLinkLayer.$$getIsCommand = function (header) { // TODO refactor needed as we have dedicated Frame class
            return !!(header & DataLinkLayer.$$_HEADER_COMMAND_BIT_SET);
        };

        DataLinkLayer.$$isFunction = function (variable) {
            return typeof variable === 'function';
        };

        return DataLinkLayer;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.DataLinkLayer.Frame', Frame);

    Frame.$inject = [
        'Rewrite.DataLinkLayer.ChecksumService'
    ];

    function Frame(
        ChecksumService
    ) {
        var Frame;

        Frame = function (id, payload, isCommand) {
            this.$$id = id;
            this.$$header = undefined;
            this.$$payload = [];
            this.$$checksum = undefined;

            this.setPayload(payload, isCommand);
        };

        Frame.$$_HEADER_FRAME_START_MARKER = 0xE0;
        Frame.$$_HEADER_COMMAND_BIT_SET = 0x10;
        Frame.$$_HEADER_COMMAND_BIT_NOT_SET = 0x00;
        Frame.$$_HEADER_PAYLOAD_LENGTH_MASK = 0x0F;
        Frame.$$_ONE_BYTE_MASK = 0xFF;

        Frame.prototype.getId = function () {
            return this.$$id;
        };

        Frame.prototype.getHeader = function () {
            return this.$$header;
        };

        Frame.prototype.getPayload = function () {
            return this.$$payload;
        };

        Frame.prototype.getChecksum = function () {
            return this.$$checksum;
        };

        Frame.prototype.setPayload = function (payload, isCommand) {
            var frameWithoutChecksum, i, byte;

            frameWithoutChecksum = [];
            this.$$header = Frame.$$generateHeader(isCommand, payload.length);
            frameWithoutChecksum.push(this.$$header);
            this.$$payload.length = 0;
            for (i = 0; i < payload.length; i++) {
                byte = payload[i] & Frame.$$_ONE_BYTE_MASK;
                this.$$payload.push(byte);
                frameWithoutChecksum.push(byte);
            }
            this.$$checksum = Frame.$$computeChecksum(frameWithoutChecksum);
        };

        Frame.$$computeChecksum = function (frameWithoutChecksum) {
            return ChecksumService.fletcher8(frameWithoutChecksum);
        };

        Frame.$$generateHeader = function (isCommand, payloadLength) {
            var frameStartMarker, commandBit, header;

            frameStartMarker = Frame.$$_HEADER_FRAME_START_MARKER;
            commandBit = isCommand
                ? Frame.$$_HEADER_COMMAND_BIT_SET
                : Frame.$$_HEADER_COMMAND_BIT_NOT_SET;
            payloadLength = Frame.$$_HEADER_PAYLOAD_LENGTH_MASK & payloadLength;

            header = frameStartMarker | commandBit | payloadLength;

            return header;
        };

        return Frame;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.DataLinkLayer.TxFrameManager', TxFrameManager);

    TxFrameManager.$inject = [];

    function TxFrameManager() {
        var TxFrameManager;

        TxFrameManager = function () {
            this.$$txFrameId = TxFrameManager.$$_INITIAL_TX_FRAME_ID;
            this.$$txFrame = null;
            this.$$txFrameCurrent = null;
            this.$$txFrameQueue = [];
        };

        TxFrameManager.$$_INITIAL_TX_FRAME_ID = 1;

        TxFrameManager.prototype.getNextTxFrameId = function () {
            return this.$$txFrameId++;
        };

        TxFrameManager.prototype.getTxFrameCloned = function () {
            return this.$$txFrame
                ? this.$$txFrame.cloneClean()
                : null;
        };

        TxFrameManager.prototype.getTxFrameProgressCloned = function () {
            var
                result = {},
                i;

            result.txFrame = this.getTxFrameCloned();

            result.txFrameCurrent = this.$$txFrameCurrent
                ? this.$$txFrameCurrent.cloneClean()
                : null;

            result.txFrameQueue = [];
            for (i = 0; i < this.$$txFrameQueue.length; i++) {
                result.txFrameQueue.push(
                    this.$$txFrameQueue[i].cloneClean()
                );
            }

            result.isTxFrameInProgress = this.isTxFrameInProgress();

            return result;
        };

        TxFrameManager.prototype.isTxFrameInProgress = function () {
            return this.$$txFrameQueue.length > 0 ||
                !!this.$$txFrameCurrent;
        };

        TxFrameManager.prototype.addTxFrame = function (txFrame) {
            this.$$txFrameQueue.push(txFrame);
        };

        TxFrameManager.prototype.handleTxSymbolId = function (txSymbolId) {
            var isQueueNotEmpty, confirmed;

            isQueueNotEmpty = this.$$txFrameQueue.length > 0;

            if (this.$$txFrameCurrent) {
                confirmed = this.$$txFrameCurrent.tryToConfirmTxSymbolId(txSymbolId);
                if (this.$$txFrameCurrent.isFullyTransmitted()) {
                    this.$$txFrame = this.$$txFrameCurrent;
                    this.$$txFrameCurrent = isQueueNotEmpty ? this.$$txFrameQueue.shift() : null;
                }
            } else {
                this.$$txFrame = null;
                this.$$txFrameCurrent = isQueueNotEmpty ? this.$$txFrameQueue.shift() : null;
            }

            if (this.$$txFrameCurrent && !confirmed) {
                this.$$txFrameCurrent.tryToConfirmTxSymbolId(txSymbolId);
            }
        };

        return TxFrameManager;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.DataLinkLayer.TxFrame', TxFrame);

    TxFrame.$inject = [
        'Rewrite.DataLinkLayer.Frame'
    ];

    function TxFrame(
        Frame
    ) {
        var TxFrame;

        TxFrame = function (txFrameId, txFramePayload, isTxFrameCommand) {
            Frame.call(this, txFrameId, txFramePayload, isTxFrameCommand);

            this.$$txSymbolId = [];
            this.$$txSymbolTransmitted = 0;
        };

        TxFrame.prototype = Object.create(Frame.prototype);
        TxFrame.prototype.constructor = TxFrame;

        TxFrame.TX_BYTE_INDEX_OUT_OF_RANGE_EXCEPTION = 'TX_BYTE_INDEX_OUT_OF_RANGE_EXCEPTION';

        TxFrame.prototype.cloneClean = function () {
            return {
                id: this.$$id,
                header: this.$$header,
                payload: this.$$payload.slice(0),
                checksum: this.$$checksum,
                isFullyTransmitted: this.isFullyTransmitted(),
                unitProgress: this.getUnitProgress(),
                txSymbolId: this.$$txSymbolId.slice(0),
                txSymbolTransmitted: this.$$txSymbolTransmitted
            };
        };

        TxFrame.prototype.getTxByteLength = function () {
            return this.$$payload.length + 2;   // payload + header + checksum
        };

        TxFrame.prototype.addTxSymbolId = function (txSymbolId) {
            this.$$txSymbolId.push(txSymbolId);
        };

        TxFrame.prototype.tryToConfirmTxSymbolId = function (txSymbolId) {
            var isTxSymbolIdPartOfThisFrame = TxFrame.$$inArray(this.$$txSymbolId, txSymbolId);

            if (isTxSymbolIdPartOfThisFrame) {
                this.$$txSymbolTransmitted++;
                return true;
            }

            return false;
        };

        TxFrame.prototype.isFullyTransmitted = function () {
            return this.$$txSymbolId.length === this.$$txSymbolTransmitted;
        };

        TxFrame.prototype.getUnitProgress = function () {
            return this.$$txSymbolTransmitted / this.$$txSymbolId.length;
        };

        TxFrame.prototype.getTxByte = function (index) {
            var txByteLength = this.getTxByteLength();

            if (index < 0 || index >= txByteLength) {
                throw TxFrame.TX_BYTE_INDEX_OUT_OF_RANGE_EXCEPTION;
            }

            if (index === 0) {
                return this.$$header;
            }

            if (index === txByteLength - 1) {
                return this.$$checksum;
            }

            return this.$$payload[index - 1];
        };

        TxFrame.$$inArray = function (array, value) {
            var i;

            for (i = 0; i < array.length; i++) {
                if (array[i] === value) {
                    return true;
                }
            }

            return false;
        };

        return TxFrame;
    }

})();

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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
// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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

// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

if (AudioNetwork.bootConfig.createAlias) {

    AudioNetwork.Rewrite = {};
    AudioNetwork.Rewrite.Dsp = {};
    AudioNetwork.Rewrite.PhysicalLayer = {};
    AudioNetwork.Rewrite.DataLinkLayer = {};
    AudioNetwork.Rewrite.Util = {};
    AudioNetwork.Rewrite.WebAudio = {};
    AudioNetwork.Visualizer = {};

    AudioNetwork.Rewrite.Dsp.Complex = AudioNetwork.Injector.resolve('Rewrite.Dsp.Complex');
    AudioNetwork.Rewrite.Dsp.Correlator = AudioNetwork.Injector.resolve('Rewrite.Dsp.Correlator');
    AudioNetwork.Rewrite.Dsp.Fft = AudioNetwork.Injector.resolve('Rewrite.Dsp.Fft');
    AudioNetwork.Rewrite.Dsp.FFTResult = AudioNetwork.Injector.resolve('Rewrite.Dsp.FFTResult');       // TODO rename to FftResult
    AudioNetwork.Rewrite.Dsp.WaveAnalyser = AudioNetwork.Injector.resolve('Rewrite.Dsp.WaveAnalyser');
    AudioNetwork.Rewrite.Dsp.WaveGenerator = AudioNetwork.Injector.resolve('Rewrite.Dsp.WaveGenerator');
    AudioNetwork.Rewrite.PhysicalLayer.PhysicalLayerBuilder = AudioNetwork.Injector.resolve('Rewrite.PhysicalLayer.PhysicalLayerBuilder');
    AudioNetwork.Rewrite.DataLinkLayer.DataLinkLayerBuilder = AudioNetwork.Injector.resolve('Rewrite.DataLinkLayer.DataLinkLayerBuilder');
    AudioNetwork.Rewrite.Util.Buffer = AudioNetwork.Injector.resolve('Rewrite.Util.Buffer');
    AudioNetwork.Rewrite.Util.FrequencyCalculator = AudioNetwork.Injector.resolve('Rewrite.Util.FrequencyCalculator');
    AudioNetwork.Rewrite.Util.MusicCalculator = AudioNetwork.Injector.resolve('Rewrite.Util.MusicCalculator');
    AudioNetwork.Rewrite.Util.SmartTimer = AudioNetwork.Injector.resolve('Rewrite.Util.SmartTimer');
    AudioNetwork.Rewrite.Util.WavAudioFile = AudioNetwork.Injector.resolve('Rewrite.Util.WavAudioFile');
    AudioNetwork.Rewrite.WebAudio.AudioMonoIO = AudioNetwork.Injector.resolve('Rewrite.WebAudio.AudioMonoIO');
    AudioNetwork.Rewrite.WebAudio.AudioMonoIOLite = AudioNetwork.Injector.resolve('Rewrite.WebAudio.AudioMonoIOLite');
    AudioNetwork.Visualizer.AnalyserChart = AudioNetwork.Injector.resolve('Visualizer.AnalyserChart');
    AudioNetwork.Visualizer.ConstellationDiagram = AudioNetwork.Injector.resolve('Visualizer.ConstellationDiagram');
    AudioNetwork.Visualizer.PowerChart = AudioNetwork.Injector.resolve('Visualizer.PowerChart');
    AudioNetwork.Visualizer.SampleChart = AudioNetwork.Injector.resolve('Visualizer.SampleChart');
    AudioNetwork.Visualizer.FrequencyDomainChart = AudioNetwork.Injector.resolve('Visualizer.FrequencyDomainChart');
    AudioNetwork.Visualizer.ComplexPlaneChart = AudioNetwork.Injector.resolve('Visualizer.ComplexPlaneChart');

    // components listed below are mostly deprecated
    AudioNetwork.PhysicalLayer = {};
    AudioNetwork.PhysicalLayerAdapter = {};
    AudioNetwork.Audio = {};
    AudioNetwork.Common = {};

    AudioNetwork.PhysicalLayer.PhysicalLayer = AudioNetwork.Injector.resolve('PhysicalLayer.PhysicalLayer'); // deprecated
    AudioNetwork.PhysicalLayer.DefaultConfig = AudioNetwork.Injector.resolve('PhysicalLayer.DefaultConfig'); // deprecated
    AudioNetwork.PhysicalLayer.RxInput = AudioNetwork.Injector.resolve('PhysicalLayer.RxInput'); // deprecated
    AudioNetwork.PhysicalLayerAdapter.TransmitAdapter = AudioNetwork.Injector.resolve('PhysicalLayerAdapter.TransmitAdapter'); // deprecated
    AudioNetwork.PhysicalLayerAdapter.ReceiveAdapter = AudioNetwork.Injector.resolve('PhysicalLayerAdapter.ReceiveAdapter'); // deprecated
    AudioNetwork.Audio.ActiveAudioContext = AudioNetwork.Injector.resolve('Audio.ActiveAudioContext'); // deprecated
    AudioNetwork.Audio.SimpleAudioContext = AudioNetwork.Injector.resolve('Audio.SimpleAudioContext'); // deprecated
    AudioNetwork.Common.Queue = AudioNetwork.Injector.resolve('Common.Queue'); // deprecated
    AudioNetwork.Common.CarrierRecovery = AudioNetwork.Injector.resolve('Common.CarrierRecovery'); // deprecated
    AudioNetwork.Common.CarrierGenerate = AudioNetwork.Injector.resolve('Common.CarrierGenerate'); // deprecated
    AudioNetwork.Common.WindowFunction = AudioNetwork.Injector.resolve('Common.WindowFunction'); // probably deprecated
    AudioNetwork.Common.Util = AudioNetwork.Injector.resolve('Common.Util'); // deprecated
}

if (AudioNetwork.isNode) {
    module.exports = AudioNetwork;
}
