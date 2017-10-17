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
    this._rxFrameListener = undefined;
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

TransportLayerBuilder.prototype.txConnectionStatus = function (listener) {
    this._txConnectionStatus = listener;
    return this;
};

TransportLayerBuilder.prototype.rxFrameListener = function (listener) {
    this._rxFrameListener = listener;
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

// -----------------------------------------------------------------------------------------

var TransportLayer;

TransportLayer = function (builder) {
    // let's create network stack!
    // Transport Layer hides Data Link Layer inside
    this.$$dataLinkLayer = (new DataLinkLayerBuilder())
        .rxFrameListener(this.$$rxFrameListener.bind(this))
        .rxFrameCandidateListener(this.$$rxFrameCandidateListener.bind(this))
        .rxSymbolListener(this.$$rxSymbolListener.bind(this))
        .rxSampleDspDetailsListener(this.$$rxSampleDspDetailsListener.bind(this))
        .rxSyncDspDetailsListener(this.$$rxSyncDspDetailsListener.bind(this))
        .rxDspConfigListener(this.$$rxDspConfigListener.bind(this))
        .dspConfigListener(this.$$dspConfigListener.bind(this))
        .txSymbolProgressListener(this.$$txSymbolProgressListener.bind(this))
        .txDspConfigListener(this.$$txDspConfigListener.bind(this))
        .build();

    // setup listeners - transport layer
    this.$$rxByteStreamListener = TransportLayer.$$isFunction(builder._rxByteStreamListener) ? builder._rxByteStreamListener : null;
    this.$$rxSegmentListener = TransportLayer.$$isFunction(builder._rxSegmentListener) ? builder._rxSegmentListener : null;
    this.$$rxConnectionStatus = TransportLayer.$$isFunction(builder._rxConnectionStatus) ? builder._rxConnectionStatus : null;
    this.$$txByteStreamListener = TransportLayer.$$isFunction(builder._txByteStreamListener) ? builder._txByteStreamListener : null;
    this.$$txConnectionStatus = TransportLayer.$$isFunction(builder._txConnectionStatus) ? builder._txConnectionStatus : null;

    // setup listeners - data link layer
    this.$$externalRxFrameListener = TransportLayer.$$isFunction(builder._rxFrameListener) ? builder._rxFrameListener : null;
    this.$$externalRxFrameCandidateListener = TransportLayer.$$isFunction(builder._rxFrameCandidateListener) ? builder._rxFrameCandidateListener : null;

    // setup listeners - physical layer
    this.$$externalRxSymbolListener = TransportLayer.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
    this.$$externalRxSampleDspDetailsListener = TransportLayer.$$isFunction(builder._rxSampleDspDetailsListener) ? builder._rxSampleDspDetailsListener : null;
    this.$$externalRxSyncListener = TransportLayer.$$isFunction(builder._rxSyncDspDetailsListener) ? builder._rxSyncDspDetailsListener : null;
    this.$$externalRxDspConfigListener = TransportLayer.$$isFunction(builder._rxDspConfigListener) ? builder._rxDspConfigListener : null;
    this.$$externalConfigListener = TransportLayer.$$isFunction(builder._dspConfigListener) ? builder._dspConfigListener : null;
    this.$$externalTxSymbolProgressListener = TransportLayer.$$isFunction(builder._txSymbolProgressListener) ? builder._txSymbolProgressListener : null;
    this.$$externalTxDspConfigListener = TransportLayer.$$isFunction(builder._txDspConfigListener) ? builder._txDspConfigListener : null;

    // TODO code below is proof of concept
    this.$$serverState = S_CLOSED;
    this.$$clientState = C_CLOSED;
    this.$$c = 1000;
    this.$$updateUI();
};

var
    C_CLOSED = 'C_CLOSED',
    C_SYN_SENT = 'C_SYN_SENT',
    C_ESTABLISHED = 'C_ESTABLISHED',
    C_HI_SENT = 'C_HI_SENT',
    C_HI_ACT_RECEIEVD = 'C_HI_ACT_RECEIEVD',
    C_HEY_RECEIEVD = 'C_HEY_RECEIEVD',
    C_HEY_ACK_SENT = 'C_HEY_ACK_SENT',

    S_CLOSED = 'S_CLOSED',
    S_LISTEN = 'S_LISTEN',
    S_SYN_RECEIVED = 'S_SYN_RECEIVED',
    S_ESTABLISHED = 'S_ESTABLISHED',
    S_HI_ACT_SENT = 'S_HI_ACT_SENT',
    S_HEY_SENT = 'S_HEY_SENT',
    S_HEY_ACT_RECEIVED = 'S_HEY_ACT_RECEIVED';

// -------------------------------------- TODO code below is just quick Proof Of Concept

function formatSegment(payload) {
    return payload.map(function (byte) { return (byte < 16 ? '0' : '') + byte.toString(16); }).join('|');
}

TransportLayer.prototype.$$updateUI = function () {
    document.getElementById('server-state').innerHTML = this.$$serverState;
    document.getElementById('client-state').innerHTML = this.$$clientState;
};

TransportLayer.prototype.clientConnect = function () {
    var p;

    switch (this.$$clientState) {
        case C_CLOSED:
            p = [0x8f, 0];
            this.$$dataLinkLayer.txFrame(p);
            html('#tx-segment', (this.$$c++) +  ' cli: ' + formatSegment(p) + '<br/>', true);
            this.$$clientState = C_SYN_SENT;
            break;
    }

    this.$$updateUI();
};

TransportLayer.prototype.clientDisconnect = function () {
    this.$$clientState = C_CLOSED;
    this.$$updateUI();
};

TransportLayer.prototype.serverListen = function () {
    this.$$serverState = S_LISTEN;
    this.$$updateUI();
};

TransportLayer.prototype.serverDisconnect = function () {
    this.$$serverState = S_CLOSED;
    this.$$updateUI();
};

TransportLayer.prototype.clientStartFakeTransmission = function () {
    var p;

    if (this.$$clientState === C_ESTABLISHED) {
        p = [0xFF, 0xEE, 0x61, 0x62, 0x63, 0x64];
        this.$$dataLinkLayer.txFrame(p);
        html('#tx-segment', (this.$$c++) +  ' cli: ' + formatSegment(p) + '<br/>', true);
        this.$$clientState = 'C_FAKE_ABCD_SENT';
    }
    this.$$updateUI();
};

TransportLayer.prototype.$$handleFramePoc = function (frame) {
    var
        segmentPayload = formatSegment(frame.payload),
        p;

    html('#rx-segment', (this.$$c++) + ' ???: ' + segmentPayload + '<br/>', true);

    // server
    switch (this.$$serverState) {
        case S_LISTEN:
            if (segmentPayload === '8f|00') {
                p = [0xc8, 0x90];
                this.$$dataLinkLayer.txFrame(p);
                html('#tx-segment', (this.$$c++) +  ' srv: ' + formatSegment(p) + '<br/>', true);
                this.$$serverState = S_SYN_RECEIVED;
            }
            break;
        case S_SYN_RECEIVED:
            if (segmentPayload === '10|c9') {
                this.$$serverState = S_ESTABLISHED;
            }
            break;
        case S_ESTABLISHED:
            if (segmentPayload === 'ff|ee|61|62|63|64') {
                p = [0xFF, 0xEE, 0x00];
                this.$$dataLinkLayer.txFrame(p);
                html('#tx-segment', (this.$$c++) +  ' srv: ' + formatSegment(p) + '<br/>', true);
                this.$$serverState = 'C_FAKE_ABCD_RECEIVED';
            }
            break;
    }

    // client
    switch (this.$$clientState) {
        case C_SYN_SENT:
            if (segmentPayload === 'c8|90') {
                p = [0x10, 0xc9];
                this.$$dataLinkLayer.txFrame(p);
                html('#tx-segment', (this.$$c++) +  ' cli: ' + formatSegment(p) + '<br/>', true);
                this.$$clientState = C_ESTABLISHED;
            }
            break;
        case 'C_FAKE_ABCD_SENT':
            if (segmentPayload === 'ff|ee|00') {
                this.$$clientState = 'C_FAKE_ABCD_ACK_RECEIVED';
            }
            break;
    }

    this.$$updateUI();
};

// --------------------------------------

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

TransportLayer.prototype.setTxAmplitude = function (txAmplitude) {
    this.$$dataLinkLayer.setTxAmplitude(txAmplitude);  // alias for easier access
};

TransportLayer.prototype.setLoopback = function (state) {
    this.$$dataLinkLayer.setLoopback(state);  // alias for easier access
};

// -----------------------------------------------------

TransportLayer.prototype.$$handleFrame = function (frame) {
    this.$$handleFramePoc(frame);
    // console.log('transport layer rx frame handler');
};

TransportLayer.prototype.$$handleTx = function () {
    // console.log('transport layer tx listener');
};

// -----------------------------------------------------

TransportLayer.prototype.$$rxFrameListener = function (data) {
    this.$$externalRxFrameListener ? this.$$externalRxFrameListener(data) : undefined;
    this.$$handleFrame(data);
};

TransportLayer.prototype.$$rxFrameCandidateListener = function (data) {
    this.$$externalRxFrameCandidateListener ? this.$$externalRxFrameCandidateListener(data) : undefined;
};

TransportLayer.prototype.$$rxSymbolListener = function (data) {
    this.$$externalRxSymbolListener ? this.$$externalRxSymbolListener(data) : undefined;
};

TransportLayer.prototype.$$rxSampleDspDetailsListener = function (data) {
    this.$$externalRxSampleDspDetailsListener ? this.$$externalRxSampleDspDetailsListener(data) : undefined;
};

TransportLayer.prototype.$$rxSyncDspDetailsListener = function (data) {
    this.$$externalRxSyncListener ? this.$$externalRxSyncListener(data) : undefined;
};

TransportLayer.prototype.$$rxDspConfigListener = function (data) {
    this.$$externalRxDspConfigListener ? this.$$externalRxDspConfigListener(data) : undefined;
};

TransportLayer.prototype.$$dspConfigListener = function (data) {
    this.$$externalConfigListener ? this.$$externalConfigListener(data) : undefined;
};

TransportLayer.prototype.$$txSymbolProgressListener = function (data) {
    this.$$externalTxSymbolProgressListener ? this.$$externalTxSymbolProgressListener(data) : undefined;
    this.$$handleTx();
};

TransportLayer.prototype.$$txDspConfigListener = function (data) {
    this.$$externalTxDspConfigListener ? this.$$externalTxDspConfigListener(data) : undefined;
};

// -----------------------------------------------------

TransportLayer.$$isFunction = function (variable) {
    return typeof variable === 'function';
};
