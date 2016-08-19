// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// AudioNetwork namespace - this is the only variable that is visible to the global JavaScript scope
var AudioNetwork = {};

AudioNetwork.Version = '1.0.4';

// AudioNetwork.isNode = typeof module !== 'undefined' && module.exports;    // running under node.js? - http://stackoverflow.com/questions/4224606
/*
AudioNetwork.isWebWorker = ??
 function testEnv() {
 if (window.document === undefined) {
    postMessage("I'm fairly confident I'm a webworker");
 } else {
    console.log("I'm fairly confident I'm in the renderer thread");
 }
 }
 */

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

    return new Injector();
})();

AudioNetwork.scriptList = [
    'audio-network-boot.js',
    'audio/active-audio-context/active-audio-context.service.js',
    'audio/simple-audio-context/simple-audio-context-builder.service.js',
    'audio/simple-audio-context/simple-audio-context.factory.js',
    'common/abstract-value-collector/abstract-value-collector.factory.js',
    'common/average-value-collector/average-value-collector-builder.service.js',
    'common/average-value-collector/average-value-collector.factory.js',
    'common/carrier-generate/carrier-generate-builder.service.js',
    'common/carrier-generate/carrier-generate.factory.js',
    'common/carrier-recovery/carrier-recovery-builder.service.js',
    'common/carrier-recovery/carrier-recovery.factory.js',
    'common/complex/complex-builder.service.js',
    'common/complex/complex.factory.js',
    'common/math-util/math-util.service.js',
    'common/queue/queue-builder.service.js',
    'common/queue/queue.factory.js',
    'common/simple-promise/simple-promise-builder.service.js',
    'common/simple-promise/simple-promise.factory.js',
    'common/util/util.service.js',
    'common/window-function/window-function.service.js',
    'physical-layer-adapter/guard-power-collector/guard-power-collector-builder.service.js',
    'physical-layer-adapter/guard-power-collector/guard-power-collector.factory.js',
    'physical-layer-adapter/phase-offset-collector/phase-offset-collector-builder.service.js',
    'physical-layer-adapter/phase-offset-collector/phase-offset-collector.factory.js',
    'physical-layer-adapter/receive-adapter-state.service.js',
    'physical-layer-adapter/receive-adapter.factory.js',
    'physical-layer-adapter/rx-state-machine-manager/rx-state-machine-manager-builder.service.js',
    'physical-layer-adapter/rx-state-machine-manager/rx-state-machine-manager.factory.js',
    'physical-layer-adapter/rx-state-machine/rx-state-machine-builder.service.js',
    'physical-layer-adapter/rx-state-machine/rx-state-machine.factory.js',
    'physical-layer-adapter/signal-power-collector/signal-power-collector-builder.service.js',
    'physical-layer-adapter/signal-power-collector/signal-power-collector.factory.js',
    'physical-layer-adapter/transmit-adapter.factory.js',
    'physical-layer-core/receive-multicore-worker/receive-multicore-worker-thread.service.js',
    'physical-layer-core/receive-multicore-worker/receive-multicore-worker.factory.js',
    'physical-layer-core/receive-worker/receive-worker.factory.js',
    'physical-layer/abstract-channel-manager/abstract-channel-manager.factory.js',
    'physical-layer/channel-receive-manager/channel-receive-manager-builder.service.js',
    'physical-layer/channel-receive-manager/channel-receive-manager.factory.js',
    'physical-layer/channel-receive/channel-receive-builder.service.js',
    'physical-layer/channel-receive/channel-receive.factory.js',
    'physical-layer/channel-transmit-manager/channel-transmit-manager-builder.service.js',
    'physical-layer/channel-transmit-manager/channel-transmit-manager.factory.js',
    'physical-layer/channel-transmit/channel-transmit-builder.service.js',
    'physical-layer/channel-transmit/channel-transmit.factory.js',
    'physical-layer/configuration-parser.service.js',
    'physical-layer/default-config.service.js',
    'physical-layer/physical-layer.factory.js',
    'physical-layer/rx-handler/rx-handler-builder.service.js',
    'physical-layer/rx-handler/rx-handler.factory.js',
    'physical-layer/rx-input.service.js',
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
