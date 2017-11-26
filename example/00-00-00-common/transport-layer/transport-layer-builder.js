// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var TransportLayerBuilder = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var TransportLayerBuilder;

    TransportLayerBuilder = function () {
        // transport layer listeners
        this._rxByteStreamListener = undefined;
        this._rxSegmentListener = undefined;
        this._rxConnectionStatus = undefined;
        this._txByteStreamListener = undefined;
        this._txSegmentListener = undefined;
        this._txConnectionStatus = undefined;

        // data link layer listeners
        this._txFrameListener = undefined;
        this._rxFrameListener = undefined;
        this._txFrameProgressListener = undefined;
        this._rxFrameCandidateListener = undefined;

        // physical layer listeners
        this._rxSymbolListener = undefined;
        this._rxSampleDspDetailsListener = undefined;
        this._rxSyncDspDetailsListener = undefined;
        this._rxDspConfigListener = undefined;
        this._dspConfigListener = undefined;
        this._txSymbolProgressListener = undefined;
        this._txDspConfigListener = undefined;
    };

    TransportLayerBuilder.prototype.rxByteStreamListener = function (listener) {
        this._rxByteStreamListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.rxSegmentListener = function (listener) {
        this._rxSegmentListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.rxConnectionStatus = function (listener) {
        this._rxConnectionStatus = listener;
        return this;
    };

    TransportLayerBuilder.prototype.txByteStreamListener = function (listener) {
        this._txByteStreamListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.txSegmentListener = function (listener) {
        this._txSegmentListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.txConnectionStatus = function (listener) {
        this._txConnectionStatus = listener;
        return this;
    };

    TransportLayerBuilder.prototype.txFrameListener = function (listener) {
        this._txFrameListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.rxFrameListener = function (listener) {
        this._rxFrameListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.txFrameProgressListener = function (listener) {
        this._txFrameProgressListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.rxFrameCandidateListener = function (listener) {
        this._rxFrameCandidateListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.rxSymbolListener = function (listener) {
        this._rxSymbolListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.rxSampleDspDetailsListener = function (listener) {
        this._rxSampleDspDetailsListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.rxSyncStatusListener = function (listener) {
        this._rxSyncStatusListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.rxSyncDspDetailsListener = function (listener) {
        this._rxSyncDspDetailsListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.rxDspConfigListener = function (listener) {
        this._rxDspConfigListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.dspConfigListener = function (listener) {
        this._dspConfigListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.txSymbolListener = function (listener) {
        this._txSymbolListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.txSymbolProgressListener = function (listener) {
        this._txSymbolProgressListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.txDspConfigListener = function (listener) {
        this._txDspConfigListener = listener;
        return this;
    };

    TransportLayerBuilder.prototype.build = function () {
        return new TransportLayer(this);
    };

    return TransportLayerBuilder;
})();
