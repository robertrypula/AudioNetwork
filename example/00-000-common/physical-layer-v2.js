// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayerV2Builder = function () {
    this._stateRxRealTimeListener = undefined;
};

PhysicalLayerV2Builder.FFT_SIZE = 8192;

PhysicalLayerV2Builder.prototype.symbolMin = function (symbolMin) {

};

PhysicalLayerV2Builder.prototype.stateRxRealTimeListener = function (listener) {
    this._stateRxRealTimeListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.build = function () {
    return new PhysicalLayerV2(this);
};

PhysicalLayerV2Builder.$$getValueOrDefault = function (value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
};

/*
var pl = PlBuilder
  .rrSymbolListener(listenerA)
  .rxRawListener(listenerB)
  .rxConfigListener()
  .txListener
  .txConfigListener
  .build();
 */

// -----------

var PhysicalLayerV2;

PhysicalLayerV2 = function (builder) {
    this.$$stateRxRealTimeHandler = [];
    this.addStateRxRealTimeListener(builder._stateRxRealTimeListener);
};

PhysicalLayerV2.prototype.addStateRxRealTimeListener = function (listener) {
    PhysicalLayerV2.$$isFunction(listener) ? this.$$stateRxRealTimeHandler.push(listener) : undefined;
};

// -----------------------------------------

PhysicalLayerV2.prototype.getRxSymbol = function () {
    return {
        id: 0,
        symbol: 0,
        sampleId: 0
    };
};

PhysicalLayerV2.prototype.getRxSample = function () {
    return {
        id: 0,
        offset: 0,
        symbolRaw: 0,
        signalDecibel: 0,
        signalNextCandidateDecibel: 0,
        signalFrequency: 0,
        noiseDecibel: 0,
        frequencyData: [],
        isConnected: 0,
        isConnectionInProgress: 0,
        isSymbolSamplingPoint: 0
    };
};

PhysicalLayerV2.prototype.getRxConnection = function () {
    return {
        id: 0,
        symbolSamplingPointOffset: undefined,
        correlationValue: undefined,
        decibelAverageSignal: undefined,
        decibelAverageNoise: undefined,
        signalToNoiseRatio: undefined,
        sampleId: 0
    };
};

PhysicalLayerV2.prototype.getRxConfig = function () {
    return {
        sampleRate: 0,
        symbolFrequencySpacing: 0,
        symbolMin: 0,
        symbolMax: 0,
        signalDecibelThreshold: 0
    };
};

PhysicalLayerV2.prototype.getConfig = function () {
    return {
        fftSkipFactor: 0,
        fftSize: 0,
        samplePerSymbol: 0,
        unitTime: 0,
        correlationCodeLength: 0
    };
};

PhysicalLayerV2.prototype.getTx = function () {
    return {
        symbol: 0,
        queue: []
    }
};

PhysicalLayerV2.prototype.getTxConfig = function () {
    return {
        sampleRate: 0,
        symbolFrequencySpacing: 0,
        symbolMin: 0,
        symbolMax: 0,
        amplitude: 0
    }
};

PhysicalLayerV2.$$isFunction = function (variable) {
    return typeof variable === 'function';
};
