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

        // setup listeners - transport layer
        this.$$connectionStatus = TransportLayer.$$isFunction(builder._connectionStatus) ? builder._connectionStatus : null;
        this.$$rxByteStreamListener = TransportLayer.$$isFunction(builder._rxByteStreamListener) ? builder._rxByteStreamListener : null;
        this.$$rxSegmentListener = TransportLayer.$$isFunction(builder._rxSegmentListener) ? builder._rxSegmentListener : null;
        this.$$txByteStreamListener = TransportLayer.$$isFunction(builder._txByteStreamListener) ? builder._txByteStreamListener : null;
        this.$$txSegmentListener = TransportLayer.$$isFunction(builder._txSegmentListener) ? builder._txSegmentListener : null;

        // setup listeners - data link layer
        this.$$externalTxFrameListener = DataLinkLayer.$$isFunction(builder._txFrameListener) ? builder._txFrameListener : null;
        this.$$externalRxFrameListener = DataLinkLayer.$$isFunction(builder._rxFrameListener) ? builder._rxFrameListener : null;
        this.$$externalTxFrameProgressListener = DataLinkLayer.$$isFunction(builder._txFrameProgressListener) ? builder._txFrameProgressListener : null;

        // state variables
        this.$$segmentPayloadLengthLimit = this.$$dataLinkLayer.getFramePayloadLengthLimit() - Segment.HEADER_BYTE_LENGTH;
        this.$$socket = new Socket(this.$$segmentPayloadLengthLimit, this);
        this.$$isTxFrameOnAir = false;
        this.$$txSymbolIdInProcessing = null;
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

    // -----------------------------------------------------

    TransportLayer.prototype.send = function (txData) {
        this.$$socket.send(txData);
        // this.$$handleTxFrameProgress();
    };

    TransportLayer.prototype.connect = function () {
        this.$$socket.connect();
    };

    TransportLayer.prototype.listen = function () {
        this.$$socket.listen();
    };

    TransportLayer.prototype.close = function () {
        this.$$socket.close();
    };

    // -----------------------------------------------------

    TransportLayer.prototype.isReceiveBlocked = function (state) {   // TODO remove me, only for debugging
        return false;
    };

    TransportLayer.prototype.onSocketStateChange = function (state) {    // TODO maybe socket should call this method in more 'listener' way (?)
        var connectionStatus = {
            state: state
        };
        this.$$connectionStatus ? this.$$connectionStatus(connectionStatus) : undefined;
    };

    TransportLayer.prototype.onRxDataChunk = function (rxDataChunk) {    // TODO maybe socket should call this method in more 'listener' way (?)
        var rxDataChunk = {
            payload: rxDataChunk[rxDataChunk.length - 1].getLastRxSegment().getPayload().splice(0)
        };
        console.log('onRxDataChunk');
        console.log(JSON.stringify(rxDataChunk, null, true));
        this.$$rxByteStreamListener ? this.$$rxByteStreamListener(rxDataChunk) : undefined;
    };

    TransportLayer.prototype.onTxDataChunk = function (txDataChunkCurrent) {    // TODO maybe socket should call this method in more 'listener' way (?)
        var txDataChunk = {
            payload: txDataChunkCurrent.getPayload().splice(0)
        };

        console.log('onTxDataChunk');
        console.log(JSON.stringify(txDataChunkCurrent, null, true));
        this.$$txByteStreamListener ? this.$$txByteStreamListener(txDataChunk) : undefined;
    };

    TransportLayer.prototype.$$handleRxFrame = function (rxFrame) {        // TODO this is POC - it will be deleted
        var rxSegment;

        try {
            rxSegment = Segment.fromRxFramePayload(rxFrame.rxFramePayload);
            // rxSegment.setRxFrameId(rxFrame.id);  // TODO track txFrameId in segment
            this.$$socket.handleRxSegment(rxSegment);
            this.$$rxSegmentListener ? this.$$rxSegmentListener(txDataChunk) : undefined;
        } catch (e) {
            console.error(e);
        }
    };

    TransportLayer.prototype.$$handleTxFrameProgress = function (txFrameProgress) {
        var
            txSymbolId = this.$$dataLinkLayer.getPhysicalLayer().getTxSymbol().id,
            txSegment = this.$$socket.getTxSegment(txSymbolId),
            txFramePayload,
            txFrameId;

        // txFrame re-triggers txFrameProgress so we need this condition in order to prevent infinite loop
        if (this.$$txSymbolIdInProcessing === txSymbolId) {
            return;
        }
        this.$$txSymbolIdInProcessing = txSymbolId;

        if (txSegment && !this.$$isTxFrameOnAir) {
            txFramePayload = txSegment.getTxFramePayload();
            txFrameId = this.$$dataLinkLayer.txFrame(txFramePayload, false);     // TODO add constant in DataLinkLayer for 'false'
            txSegment.setTxFrameId(txFrameId);
            this.$$isTxFrameOnAir = true;
        }
        this.$$txSymbolIdInProcessing = null;
    };

    TransportLayer.prototype.$$handleTxFrame = function (txFrame) {
        this.$$socket.txSegmentSent();
        this.$$isTxFrameOnAir = false;
    };

    // -----------------------------------------------------

    TransportLayer.prototype.$$rxFrameListener = function (data) {
        this.$$externalRxFrameListener ? this.$$externalRxFrameListener(data) : undefined;
        this.$$handleRxFrame(data);
    };

    TransportLayer.prototype.$$txFrameProgressListener = function (data) {
        this.$$externalTxFrameProgressListener ? this.$$externalTxFrameProgressListener(data) : undefined;
        this.$$handleTxFrameProgress(data);
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
