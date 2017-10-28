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
            .txFrameProgressListener(this.$$txFrameProgressListener.bind(this))
            .rxFrameCandidateListener(builder._rxFrameCandidateListener)
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

        // state variables
        this.$$segmentPayloadLengthLimit = this.$$dataLinkLayer.getFramePayloadLengthLimit() - Segment.HEADER_BYTE_LENGTH;
        this.$$socket = new Socket(this.$$segmentPayloadLengthLimit);
        this.$$loopbackSocket = new Socket(this.$$segmentPayloadLengthLimit);

        // setup listeners - transport layer
        this.$$rxByteStreamListener = TransportLayer.$$isFunction(builder._rxByteStreamListener) ? builder._rxByteStreamListener : null;
        this.$$rxSegmentListener = TransportLayer.$$isFunction(builder._rxSegmentListener) ? builder._rxSegmentListener : null;
        this.$$rxConnectionStatus = TransportLayer.$$isFunction(builder._rxConnectionStatus) ? builder._rxConnectionStatus : null;
        this.$$txByteStreamListener = TransportLayer.$$isFunction(builder._txByteStreamListener) ? builder._txByteStreamListener : null;
        this.$$txSegmentListener = TransportLayer.$$isFunction(builder._txSegmentListener) ? builder._txSegmentListener : null;
        this.$$txConnectionStatus = TransportLayer.$$isFunction(builder._txConnectionStatus) ? builder._txConnectionStatus : null;

        // setup listeners - data link layer
        this.$$externalTxFrameListener = DataLinkLayer.$$isFunction(builder._txFrameListener) ? builder._txFrameListener : null;
        this.$$externalRxFrameListener = DataLinkLayer.$$isFunction(builder._rxFrameListener) ? builder._rxFrameListener : null;
        this.$$externalTxFrameProgressListener = DataLinkLayer.$$isFunction(builder._txFrameProgressListener) ? builder._txFrameProgressListener : null;
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

    TransportLayer.prototype.txData = function (txData) {
        this.$$socket.addTxData(txData);
        this.$$lookForSegmentToTransmit();
    };

    // -----------------------------------------------------

    TransportLayer.prototype.$$handleTxFrame = function (txFrame) {
        var txSegment = this.$$socket.findTxSegmentByTxFrameId(txFrame.id);

        if (txSegment) {
            txSegment.txCompleted();
            this.$$lookForSegmentToTransmit();
        }
    };

    TransportLayer.prototype.$$handleRxFrame = function (rxFrame) {
        var rxSegment = Segment.fromRxFramePayload(rxFrame.rxFramePayload);

        rxSegment.setRxFrameId(rxFrame.id);
        console.log('RX Segment', rxSegment);
        this.$$socket.handleRxSegment(rxSegment);
        this.$$lookForSegmentToTransmit();
    };

    TransportLayer.prototype.$$lookForSegmentToTransmit = function () {
        var
            txSymbolId = this.$$dataLinkLayer.getPhysicalLayer().getTxSymbol().id,     // we need to go deeper... ;)
            txSegment = this.$$socket.getTxSegment(txSymbolId),
            txFramePayload,
            txFrameId;

        if (txSegment) {
            txFramePayload = txSegment.getTxFramePayload();
            txFrameId = this.$$dataLinkLayer.txFrame(txFramePayload, false);
            txSegment.setTxFrameId(txFrameId);
            console.log('TX Segment', txSegment);
            this.$$lookForSegmentToTransmit(); // recursive call for more segments (sliding window support in the future)
        }
    };

    // -----------------------------------------------------

    TransportLayer.prototype.$$txFrameListener = function (data) {
        this.$$externalTxFrameListener ? this.$$externalTxFrameListener(data) : undefined;
        this.$$handleTxFrame(data);
    };

    TransportLayer.prototype.$$rxFrameListener = function (data) {
        this.$$externalRxFrameListener ? this.$$externalRxFrameListener(data) : undefined;
        this.$$handleRxFrame(data);
    };

    TransportLayer.prototype.$$txFrameProgressListener = function (data) {
        this.$$externalTxFrameProgressListener ? this.$$externalTxFrameProgressListener(data) : undefined;
        this.$$lookForSegmentToTransmit();
    };

    // -----------------------------------------------------

    TransportLayer.$$isFunction = function (variable) {
        return typeof variable === 'function';
    };

    return TransportLayer;
})();
