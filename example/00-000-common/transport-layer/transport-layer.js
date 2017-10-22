// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var TransportLayer = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var TransportLayer;

    TransportLayer = function (builder) {
        // let's create network stack!
        // Transport Layer hides Data Link Layer inside
        this.$$dataLinkLayer = (new DataLinkLayerBuilder())
            .txFrameListener(this.$$txFrameListener.bind(this))
            .rxFrameListener(this.$$rxFrameListener.bind(this))
            .rxSymbolListener(builder._rxSymbolListener)
            .rxSampleDspDetailsListener(builder._rxSampleDspDetailsListener)
            .rxSyncStatusListener(builder._rxSyncStatusListener)
            .rxSyncDspDetailsListener(builder._rxSyncDspDetailsListener)
            .rxDspConfigListener(builder._rxDspConfigListener)
            .dspConfigListener(builder._dspConfigListener)
            .txSymbolListener(builder._txSymbolListener)
            .txSymbolProgressListener(builder._txSymbolProgressListener)
            .txDspConfigListener(builder._txDspConfigListener)
            .build();

        // setup listeners - transport layer
        this.$$rxByteStreamListener = TransportLayer.$$isFunction(builder._rxByteStreamListener) ? builder._rxByteStreamListener : null;
        this.$$rxSegmentListener = TransportLayer.$$isFunction(builder._rxSegmentListener) ? builder._rxSegmentListener : null;
        this.$$rxConnectionStatus = TransportLayer.$$isFunction(builder._rxConnectionStatus) ? builder._rxConnectionStatus : null;
        this.$$txByteStreamListener = TransportLayer.$$isFunction(builder._txByteStreamListener) ? builder._txByteStreamListener : null;
        this.$$txSegmentListener = TransportLayer.$$isFunction(builder._txSegmentListener) ? builder._txSegmentListener : null;
        this.$$txConnectionStatus = TransportLayer.$$isFunction(builder._txConnectionStatus) ? builder._txConnectionStatus : null;

        // setup listeners - data link layer
        this.$$externalRxFrameListener = DataLinkLayer.$$isFunction(builder._rxFrameListener) ? builder._rxFrameListener : null;
        this.$$externalTxFrameListener = DataLinkLayer.$$isFunction(builder._txFrameListener) ? builder._txFrameListener : null;
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

    TransportLayer.prototype.txSync = function () {
        this.$$dataLinkLayer.txSync();  // alias for easier access
    };

    TransportLayer.prototype.txTwoWaySync = function () {
        this.$$dataLinkLayer.txTwoWaySync();  // alias for easier access
    };

    TransportLayer.prototype.setTxAmplitude = function (txAmplitude) {
        this.$$dataLinkLayer.setTxAmplitude(txAmplitude);  // alias for easier access
    };

    TransportLayer.prototype.setLoopback = function (state) {
        this.$$dataLinkLayer.setLoopback(state);  // alias for easier access
    };

    // -----------------------------------------------------

    TransportLayer.prototype.txByteStream = function (data) {

    };

    // -----------------------------------------------------

    TransportLayer.prototype.$$handleRxFrameListener = function (data) {

    };

    TransportLayer.prototype.$$handleTxFrameListener = function (data) {

    };

    // -----------------------------------------------------

    TransportLayer.prototype.$$rxFrameListener = function (data) {
        this.$$externalRxFrameListener ? this.$$externalRxFrameListener(data) : undefined;
        this.$$handleRxFrame(data);
    };

    TransportLayer.prototype.$$txFrameListener = function (data) {
        this.$$externalTxFrameListener ? this.$$externalTxFrameListener(data) : undefined;
        this.$$handleTxFrame(data);
    };

    // -----------------------------------------------------

    TransportLayer.$$isFunction = function (variable) {
        return typeof variable === 'function';
    };

    return TransportLayer;
})();
