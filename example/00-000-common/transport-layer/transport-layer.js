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


        this.setFakeState(TransportLayer.STATE_CLOSED);
    };

    // | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
    //      - - P T T P -           - - P T T P -       - - P T T A H e l l P -           - - P T T o ! P -                                       - - P T T P -
    //                  - - P T T P -                                         - - P T T P -               - - P T T P -       - - P T T A H i ! P -

    // C   SS                        E                 MA1_S                             MA2_S                       MA2_CON                       MB_R
    // C L               SR                        E                          MA1_R                        MA2_R              MB_S

    TransportLayer.STATE_CLOSED = 'STATE_CLOSED';
    TransportLayer.STATE_LISTEN = 'STATE_LISTEN';
    TransportLayer.STATE_SYN_SENT = 'STATE_SYN_SENT';
    TransportLayer.STATE_SYN_RECEIVED = 'STATE_SYN_RECEIVED';
    TransportLayer.STATE_ESTABLISHED = 'STATE_ESTABLISHED';
    TransportLayer.STATE_MA1_SENT = 'STATE_MA1_SENT';
    TransportLayer.STATE_MA1_RECEIVED = 'STATE_MA1_RECEIVED';
    TransportLayer.STATE_MA1_CONFIRMED = 'STATE_MA1_CONFIRMED';
    TransportLayer.STATE_MA2_SENT = 'STATE_MA2_SENT';
    TransportLayer.STATE_MA2_RECEIVED = 'STATE_MA2_RECEIVED';
    TransportLayer.STATE_MA2_CONFIRMED = 'STATE_MA2_CONFIRMED';
    TransportLayer.STATE_MB_SENT = 'STATE_MB_SENT';
    TransportLayer.STATE_MB_RECEIVED = 'STATE_MB_RECEIVED';
    TransportLayer.STATE_MB_CONFIRMED = 'STATE_MB_CONFIRMED';

    TransportLayer.MESSAGE_A_1 = [0x06, 'H'.charAt(0), 'e'.charAt(0), 'l'.charAt(0), 'l'.charAt(0)];
    TransportLayer.MESSAGE_A_2 = ['o'.charAt(0), '!'.charAt(0)];
    TransportLayer.MESSAGE_B = [0x03, 'H'.charAt(0), 'i'.charAt(0), '!'.charAt(0)];

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

    TransportLayer.prototype.fakeClose = function () {        // TODO this is POC - it will be deleted
        this.setFakeState(TransportLayer.STATE_CLOSED);
    };

    TransportLayer.prototype.fakeListen = function () {        // TODO this is POC - it will be deleted
        this.setFakeState(TransportLayer.STATE_LISTEN);
    };

    TransportLayer.prototype.fakeConnect = function () {        // TODO this is POC - it will be deleted
        if (this.$$fakeState === TransportLayer.STATE_CLOSED) {
            this._txSegment(true, 20, false, 0, []);
            this.setFakeState(TransportLayer.STATE_SYN_SENT);
        }
    };

    TransportLayer.prototype.fakeMessageA = function () {        // TODO this is POC - it will be deleted
        if (this.$$fakeState === TransportLayer.STATE_ESTABLISHED) {
            this._txSegment(true, 20, true, 0, TransportLayer.MESSAGE_A_1);
            this.setFakeState(TransportLayer.STATE_MA1_SENT);
        }
    };

    TransportLayer.prototype.fakeMessageB = function () {        // TODO this is POC - it will be deleted
        if (this.$$fakeState === TransportLayer.STATE_MA2_RECEIVED) {
            this._txSegment(true, 20, true, 0, TransportLayer.MESSAGE_B);
            this.setFakeState(TransportLayer.STATE_MB_SENT);
        }
    };

    TransportLayer.prototype.$$handleTxFrame = function (txFrame) {
        /*
        var txSegment = this.$$socket.findTxSegmentByTxFrameId(txFrame.id);

        if (txSegment) {
            txSegment.txCompleted();
            this.$$lookForSegmentToTransmit();
        }
        */
    };

    TransportLayer.prototype.$$handleRxFrame = function (rxFrame) {        // TODO this is POC - it will be deleted
        var
            rxSegment = Segment.fromRxFramePayload(rxFrame.rxFramePayload),
            rxSegmentPayload = rxSegment.getPayload();

        switch (this.$$fakeState) {
            case TransportLayer.STATE_CLOSED:                                     // SER / CLI
                break;
            case TransportLayer.STATE_LISTEN:                                     // SER
                if (TransportLayer.equal(rxSegmentPayload, [])) {
                    this._txSegment(true, 20, true, 0, []);
                    this.setFakeState(TransportLayer.STATE_SYN_RECEIVED);
                }
                break;
            case TransportLayer.STATE_SYN_SENT:                                   // CLI
                if (TransportLayer.equal(rxSegmentPayload, [])) {
                    this._txSegment(true, 20, true, 0, []);
                    this.setFakeState(TransportLayer.STATE_ESTABLISHED);
                }
                break;
            case TransportLayer.STATE_SYN_RECEIVED:                               // SER
                if (TransportLayer.equal(rxSegmentPayload, [])) {
                    this.setFakeState(TransportLayer.STATE_ESTABLISHED);
                }
                break;
            case TransportLayer.STATE_ESTABLISHED:                                // SER
                if (TransportLayer.equal(rxSegmentPayload, TransportLayer.MESSAGE_A_1)) {
                    this._txSegment(true, 20, true, 0, []);
                    this.setFakeState(TransportLayer.STATE_MA1_RECEIVED);
                }
                break;
            case TransportLayer.STATE_MA1_SENT:                                   // CLI
                if (TransportLayer.equal(rxSegmentPayload, [])) {
                    this._txSegment(true, 20, true, 0, TransportLayer.MESSAGE_A_2);
                    this.setFakeState(TransportLayer.STATE_MA2_SENT);
                }
                break;
            case TransportLayer.STATE_MA1_RECEIVED:                               // SER
                if (TransportLayer.equal(rxSegmentPayload, TransportLayer.MESSAGE_A_2)) {
                    this._txSegment(true, 20, true, 0, []);
                    this.setFakeState(TransportLayer.STATE_MA2_RECEIVED);
                }
                break;
            case TransportLayer.STATE_MA2_SENT:                                   // CLI
                if (TransportLayer.equal(rxSegmentPayload, [])) {
                    this.setFakeState(TransportLayer.STATE_MA2_CONFIRMED);
                }
                break;
            case TransportLayer.STATE_MA2_RECEIVED:
                // -------------
                break;
            case TransportLayer.STATE_MA2_CONFIRMED:
                if (TransportLayer.equal(rxSegmentPayload, TransportLayer.MESSAGE_B)) {
                    this._txSegment(true, 20, true, 0, []);
                    this.setFakeState(TransportLayer.STATE_MB_RECEIVED);
                }
                break;
            case TransportLayer.STATE_MB_SENT:
                if (TransportLayer.equal(rxSegmentPayload, [])) {
                    this.setFakeState(TransportLayer.STATE_MB_CONFIRMED);
                }
                break;
        }

        /*
        var rxSegment = Segment.fromRxFramePayload(rxFrame.rxFramePayload);

        rxSegment.setRxFrameId(rxFrame.id);
        console.log('RX Segment', rxSegment);
        this.$$socket.handleRxSegment(rxSegment);
        this.$$lookForSegmentToTransmit();
        */
    };

    TransportLayer.prototype._txSegment = function (synFlag, sNumber, ackFlag, aNumber, payload) {        // TODO this is POC - it will be deleted
        this.$$dataLinkLayer.txFrame((new Segment(synFlag, sNumber, ackFlag, aNumber, payload)).getTxFramePayload(), false);
    };

    TransportLayer.prototype.setFakeState = function (state) {        // TODO this is POC - it will be deleted
        this.$$fakeState = state;
        externalFakeStateListener(this.$$fakeState);
    };

    TransportLayer.equal = function (a, b) {
        return a.join('|') === b.join('|');
    };

    TransportLayer.prototype.$$lookForSegmentToTransmit = function () {
        /*
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
        */
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
