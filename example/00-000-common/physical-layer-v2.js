// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayerV2Builder = function () {

    this._stateRxRealTimeListener = undefined;
    this._stateRxListener = undefined;
    this._stateTxRealTimeListener = undefined;
    this._stateTxListener = undefined;
};

PhysicalLayerV2Builder.FFT_SIZE = 8192;

PhysicalLayerV2Builder.prototype.symbolMin = function (symbolMin) {

};

PhysicalLayerV2Builder.prototype.stateRxRealTimeListener = function (listener) {
    this._stateRxRealTimeListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.stateRxListener = function (listener) {
    this._stateRxListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.stateTxRealTimeListener = function (listener) {
    this._stateTxRealTimeListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.stateTxListener = function (listener) {
    this._stateTxListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.build = function () {
    return new PhysicalLayerV2(this);
};

PhysicalLayerV2Builder.$$getValueOrDefault = function (value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
};

// -----------

var PhysicalLayerV2;

PhysicalLayerV2 = function (builder) {
    this.$$stateRxRealTimeHandler = [];
    this.$$stateRxListener = [];
    this.$$stateTxRealTimeHandler = [];
    this.$$stateTxHandler = [];

    this.addStateRxRealTimeListener(builder._stateRxRealTimeListener);
    this.addStateRxListener(builder._stateRxListener);
    this.addStateTxRealTimeListener(builder._stateTxRealTimeListener);
    this.addStateTxListener(builder._stateTxListener);
};

PhysicalLayerV2.prototype.addStateRxRealTimeListener = function (listener) {
    PhysicalLayerV2.$$isFunction(listener) ? this.$$stateRxRealTimeHandler.push(listener) : undefined;
};

PhysicalLayerV2.prototype.addStateRxListener = function (listener) {
    PhysicalLayerV2.$$isFunction(listener) ? this.$$stateRxListener.push(listener) : undefined;
};

PhysicalLayerV2.prototype.addStateTxRealTimeListener = function (listener) {
    PhysicalLayerV2.$$isFunction(listener) ? this.$$stateTxRealTimeHandler.push(listener) : undefined;
};

PhysicalLayerV2.prototype.addStateTxListener = function (listener) {
    PhysicalLayerV2.$$isFunction(listener) ? this.$$stateTxHandler.push(listener) : undefined;
};

PhysicalLayerV2.prototype.getStateRxRealTime = function () {
    return {
        symbolNumber: 0,
        symbol: 0,
        quality: 0,
        isSymbolSamplingPoint: 0,
        isConnected: 0,
        isConnectionInProgress: 0,
        realTimeDetail: {
            sampleNumber: 0,
            offset: 0,
            symbol: 0,
            frequency: 0,
            decibelSignal: 0,
            decibelSignalNextCandidate: 0,
            decibelNoise: 0,
            decibelList: []
        }
    }
};

PhysicalLayerV2.prototype.getStateRx = function () {
    return {
        sampleRate: 0,
        samplePerSymbol: 0,
        fftSize: 0,
        fftWindowTime: 0,
        fftFrequencyBinSkipFactor: 0,
        symbolFrequencySpacing: 0,
        symbolMin: 0,
        symbolMax: 0,
        decibelSignalThreshold: 0,
        correlationCodeLength: 0,
        connectionDetail: {
            id: undefined,
            offset: undefined,
            correlationValue: undefined,
            decibelAverageSignal: undefined,
            decibelAverageNoise: undefined,
            signalToNoiseRatio: undefined
        }
    }
};

PhysicalLayerV2.prototype.getStateTxRealTime = function () {
    return {
        queue: [],
        symbol: 0,
        isTransmitting: 0
    }
};

PhysicalLayerV2.prototype.getStateTx = function () {
    return {
        sampleRate: 0,
        symbolMin: 0,
        symbolMax: 0,
        amplitude: 0
    }
};

PhysicalLayerV2.$$isFunction = function (variable) {
    return typeof variable === 'function';
};
