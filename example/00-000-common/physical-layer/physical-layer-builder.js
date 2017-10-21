// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayerBuilder = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
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
})();
