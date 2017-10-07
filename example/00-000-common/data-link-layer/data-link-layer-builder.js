// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var DataLinkLayerBuilder = function () {
    this._framePayloadLengthMax = 7;

    // data link layer listeners
    this._frameListener = undefined;
    this._frameCandidateListener = undefined;

    // physical layer listeners
    this._rxSymbolListener = undefined;
    this._rxSampleDspDetailsListener = undefined;
    this._rxSyncListener = undefined;
    this._rxDspConfigListener = undefined;
    this._dspConfigListener = undefined;
    this._txListener = undefined;
    this._txDspConfigListener = undefined;
};

DataLinkLayerBuilder.prototype.framePayloadLengthMax = function (framePayloadLengthMax) {
    this._framePayloadLengthMax = framePayloadLengthMax;
    return this;
};

DataLinkLayerBuilder.prototype.frameListener = function (frameListener) {
    this._frameListener = frameListener;
    return this;
};

DataLinkLayerBuilder.prototype.frameCandidateListener = function (frameCandidateListener) {
    this._frameCandidateListener = frameCandidateListener;
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

DataLinkLayerBuilder.prototype.rxSyncListener = function (listener) {
    this._rxSyncListener = listener;
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

DataLinkLayerBuilder.prototype.txListener = function (listener) {
    this._txListener = listener;
    return this;
};

DataLinkLayerBuilder.prototype.txDspConfigListener = function (listener) {
    this._txDspConfigListener = listener;
    return this;
};

DataLinkLayerBuilder.prototype.build = function () {
    return new DataLinkLayer(this);
};
