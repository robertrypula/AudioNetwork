// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';


var TransportLayerBuilder = function () {
    // transport layer listeners
    this._rxByteStreamListener = undefined;
    this._rxSegmentListener = undefined;
    this._rxConnectionStatus = undefined;
    this._txByteStreamListener = undefined;
    this._txConnectionStatus = undefined;

    // data link layer listeners
    this._frameListener = undefined;
    this._frameCandidateListener = undefined;

    // physical layer listeners
    this._rxSymbolListener = undefined;
    this._rxSampleListener = undefined;
    this._rxSyncListener = undefined;
    this._rxConfigListener = undefined;
    this._configListener = undefined;
    this._txListener = undefined;
    this._txConfigListener = undefined;
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

TransportLayerBuilder.prototype.txConnectionStatus = function (listener) {
    this._txConnectionStatus = listener;
    return this;
};

TransportLayerBuilder.prototype.frameListener = function (listener) {
    this._frameListener = listener;
    return this;
};

TransportLayerBuilder.prototype.frameCandidateListener = function (listener) {
    this._frameCandidateListener = listener;
    return this;
};

TransportLayerBuilder.prototype.rxSymbolListener = function (listener) {
    this._rxSymbolListener = listener;
    return this;
};

TransportLayerBuilder.prototype.rxSampleListener = function (listener) {
    this._rxSampleListener = listener;
    return this;
};

TransportLayerBuilder.prototype.rxSyncListener = function (listener) {
    this._rxSyncListener = listener;
    return this;
};

TransportLayerBuilder.prototype.rxConfigListener = function (listener) {
    this._rxConfigListener = listener;
    return this;
};

TransportLayerBuilder.prototype.configListener = function (listener) {
    this._configListener = listener;
    return this;
};

TransportLayerBuilder.prototype.txListener = function (listener) {
    this._txListener = listener;
    return this;
};

TransportLayerBuilder.prototype.txConfigListener = function (listener) {
    this._txConfigListener = listener;
    return this;
};

TransportLayerBuilder.prototype.build = function () {
    return new TransportLayer(this);
};

// -----------------------------------------------------------------------------------------

var TransportLayer;

TransportLayer = function (builder) {
    // let's create network stack!
    // Transport Layer hides Data Link Layer inside
    this.$$dataLinkLayer = (new DataLinkLayerBuilder())
        .frameListener(this.$$frameListener.bind(this))
        .frameCandidateListener(this.$$frameCandidateListener.bind(this))
        .rxSymbolListener(this.$$rxSymbolListener.bind(this))
        .rxSampleListener(this.$$rxSampleListener.bind(this))
        .rxSyncListener(this.$$rxSyncListener.bind(this))
        .rxConfigListener(this.$$rxConfigListener.bind(this))
        .configListener(this.$$configListener.bind(this))
        .txListener(this.$$txListener.bind(this))
        .txConfigListener(this.$$txConfigListener.bind(this))
        .build();

    // setup listeners - transport layer
    this.$$rxByteStreamListener = TransportLayer.$$isFunction(builder._rxByteStreamListener) ? builder._rxByteStreamListener : null;
    this.$$rxSegmentListener = TransportLayer.$$isFunction(builder._rxSegmentListener) ? builder._rxSegmentListener : null;
    this.$$rxConnectionStatus = TransportLayer.$$isFunction(builder._rxConnectionStatus) ? builder._rxConnectionStatus : null;
    this.$$txByteStreamListener = TransportLayer.$$isFunction(builder._txByteStreamListener) ? builder._txByteStreamListener : null;
    this.$$txConnectionStatus = TransportLayer.$$isFunction(builder._txConnectionStatus) ? builder._txConnectionStatus : null;

    // setup listeners - data link layer
    this.$$externalFrameListener = TransportLayer.$$isFunction(builder._frameListener) ? builder._frameListener : null;
    this.$$externalFrameCandidateListener = TransportLayer.$$isFunction(builder._frameCandidateListener) ? builder._frameCandidateListener : null;

    // setup listeners - physical layer
    this.$$externalRxSymbolListener = TransportLayer.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
    this.$$externalRxSampleListener = TransportLayer.$$isFunction(builder._rxSampleListener) ? builder._rxSampleListener : null;
    this.$$externalRxSyncListener = TransportLayer.$$isFunction(builder._rxSyncListener) ? builder._rxSyncListener : null;
    this.$$externalRxConfigListener = TransportLayer.$$isFunction(builder._rxConfigListener) ? builder._rxConfigListener : null;
    this.$$externalConfigListener = TransportLayer.$$isFunction(builder._configListener) ? builder._configListener : null;
    this.$$externalTxListener = TransportLayer.$$isFunction(builder._txListener) ? builder._txListener : null;
    this.$$externalTxConfigListener = TransportLayer.$$isFunction(builder._txConfigListener) ? builder._txConfigListener : null;
};


TransportLayer.prototype.getDataLinkLayer = function () {
    return this.$$dataLinkLayer;
};

TransportLayer.prototype.getRxSampleRate = function () {
    return this.$$dataLinkLayer.getRxSampleRate();
};

TransportLayer.prototype.setTxSampleRate = function (txSampleRate) {
    this.$$dataLinkLayer.setTxSampleRate(txSampleRate);  // alias for easier access
};

TransportLayer.prototype.txTwoWaySync = function () {
    this.$$dataLinkLayer.txTwoWaySync();  // alias for easier access
};

TransportLayer.prototype.setAmplitude = function (amplitude) {
    this.$$dataLinkLayer.setAmplitude(amplitude);  // alias for easier access
};

TransportLayer.prototype.setLoopback = function (state) {
    this.$$dataLinkLayer.setLoopback(state);  // alias for easier access
};

// -----------------------------------------------------

TransportLayer.prototype.$$handleFrame = function () {
    console.log('transport layer rx frame handler');
};

TransportLayer.prototype.$$handleTx = function () {
    console.log('transport layer tx listener');
};

// -----------------------------------------------------

TransportLayer.prototype.$$frameListener = function (data) {
    this.$$externalFrameListener ? this.$$externalFrameListener(data) : undefined;
    this.$$handleFrame();
};

TransportLayer.prototype.$$frameCandidateListener = function (data) {
    this.$$externalFrameCandidateListener ? this.$$externalFrameCandidateListener(data) : undefined;
};

TransportLayer.prototype.$$rxSymbolListener = function (data) {
    this.$$externalRxSymbolListener ? this.$$externalRxSymbolListener(data) : undefined;
};

TransportLayer.prototype.$$rxSampleListener = function (data) {
    this.$$externalRxSampleListener ? this.$$externalRxSampleListener(data) : undefined;
};

TransportLayer.prototype.$$rxSyncListener = function (data) {
    this.$$externalRxSyncListener ? this.$$externalRxSyncListener(data) : undefined;
};

TransportLayer.prototype.$$rxConfigListener = function (data) {
    this.$$externalRxConfigListener ? this.$$externalRxConfigListener(data) : undefined;
};

TransportLayer.prototype.$$configListener = function (data) {
    this.$$externalConfigListener ? this.$$externalConfigListener(data) : undefined;
};

TransportLayer.prototype.$$txListener = function (data) {
    this.$$externalTxListener ? this.$$externalTxListener(data) : undefined;
    this.$$handleTx();
};

TransportLayer.prototype.$$txConfigListener = function (data) {
    this.$$externalTxConfigListener ? this.$$externalTxConfigListener(data) : undefined;
};

// -----------------------------------------------------