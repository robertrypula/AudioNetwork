// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var DataLinkLayerBuilder = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
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
})();
