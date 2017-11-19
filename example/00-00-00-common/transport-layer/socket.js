// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Socket = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var Socket;

    Socket = function (segmentPayloadLengthLimit, socketClient) {
        this.$$segmentPayloadLengthLimit = segmentPayloadLengthLimit;
        this.$$socketClient = socketClient;

        this.$$initialSequenceNumber = undefined;
        this.$$sequenceNumber = undefined;
        this.$$acknowledgementNumber = undefined;

        this.$$state = undefined;
        this.$$updateState(Socket.CLOSED);
    };

    Socket.CLOSED = 'CLOSED';
    Socket.LISTEN = 'LISTEN';
    Socket.HANDSHAKE_A_WAIT = 'HANDSHAKE_A_WAIT';
    Socket.HANDSHAKE_A_IN_PROGRESS = 'HANDSHAKE_A_IN_PROGRESS';

    Socket.prototype.close = function () {
        this.$$updateState(Socket.CLOSED);
    };

    Socket.prototype.listen = function () {
        this.$$updateState(Socket.LISTEN);
    };

    Socket.prototype.connect = function () {
        switch (this.$$state) {
            case Socket.CLOSED:
                this.$$updateState(Socket.HANDSHAKE_A_WAIT);
                break;
        }
    };

    Socket.prototype.send = function () {};

    Socket.prototype.findTxSegmentByTxFrameId = function (txFrameId) {console.log('findTxSegmentByTxFrameId', txFrameId)};

    Socket.prototype.handleRxSegment = function (rxSegment) {
        console.log('handleRxSegment', rxSegment);
        switch (this.$$state) {
            case Socket.LISTEN:
                /*
                if (rxSegment.isHandshakeSyn()) {
                    this.$$acknowledgementNumber = rxSegment.getSequenceNumber() + 1;

                    this.$$updateState(Socket.HANDSHAKE_A_IN_PROGRESS);
                }
                */
                break;
        }
    };

    Socket.prototype.getTxSegment = function () {
        var txSegment = null;

        switch (this.$$state) {
            case Socket.HANDSHAKE_A_WAIT:
                txSegment = Segment.handshakeSyn();
                this.$$initialSequenceNumber = txSegment.getSequenceNumber();
                this.$$sequenceNumber = this.$$initialSequenceNumber;
                this.$$acknowledgementNumber = txSegment.getAcknowledgmentNumber();
                this.$$updateState(Socket.HANDSHAKE_A_IN_PROGRESS);
                break;
        }

        return txSegment;
    };

    Socket.prototype.$$updateState = function (newState) {
        this.$$state = newState;
        this.$$socketClient.onSocketStateChange(this.$$state);
    };

    return Socket;
})();
