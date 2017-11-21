// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Socket = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var Socket;

    Socket = function (segmentPayloadLengthLimit, socketClient) {
        this.$$segmentPayloadLengthLimit = segmentPayloadLengthLimit;
        this.$$socketClient = socketClient;

        this.$$initialSequenceNumber = undefined;
        this.$$sequenceNumber = undefined;
        this.$$sequenceNumberNext = undefined;
        this.$$acknowledgementNumberForLastRxSegment = undefined;
        this.$$txSegment = [];
        this.$$txSegmentCurrent = null;

        this.$$state = undefined;
        this.$$updateState(Socket.CLOSED);
    };

    Socket.CLOSED = 'CLOSED';
    Socket.LISTEN = 'LISTEN';
    Socket.HANDSHAKE_A_WAIT = 'HANDSHAKE_A_WAIT';
    Socket.HANDSHAKE_A_IN_PROGRESS = 'HANDSHAKE_A_IN_PROGRESS';
    Socket.HANDSHAKE_A_SENT = 'HANDSHAKE_A_SENT';
    Socket.HANDSHAKE_B_WAIT = 'HANDSHAKE_B_WAIT';
    Socket.HANDSHAKE_B_IN_PROGRESS = 'HANDSHAKE_B_IN_PROGRESS';
    Socket.HANDSHAKE_B_SENT = 'HANDSHAKE_B_SENT';
    Socket.HANDSHAKE_C_WAIT = 'HANDSHAKE_C_WAIT';
    Socket.HANDSHAKE_C_IN_PROGRESS = 'HANDSHAKE_C_IN_PROGRESS';
    Socket.HANDSHAKE_C_SENT = 'HANDSHAKE_C_SENT';
    Socket.ESTABLISHED = 'ESTABLISHED';

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

    Socket.prototype.txSegmentSent = function () {
        switch (this.$$state) {
            case Socket.HANDSHAKE_A_IN_PROGRESS:
                this.$$updateState(Socket.HANDSHAKE_A_SENT);
                break;
            case Socket.HANDSHAKE_B_IN_PROGRESS:
                this.$$updateState(Socket.HANDSHAKE_B_SENT);
                break;
            case Socket.HANDSHAKE_C_IN_PROGRESS:
                this.$$updateState(Socket.ESTABLISHED);
                break;
        }


        this.$$txSegment.push(this.$$txSegmentCurrent);
        this.$$txSegmentCurrent = null;
    };

    Socket.prototype.handleRxSegment = function (rxSegment) {
        console.log('handleRxSegment', rxSegment, rxSegment.getHeaderLog());
        switch (this.$$state) {
            case Socket.LISTEN:
                if (!rxSegment.isHandshakeSyn()) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.HANDSHAKE_B_WAIT);
                break;
            case Socket.HANDSHAKE_A_SENT:
                if (!rxSegment.isHandshakeSynAck() || rxSegment.getAcknowledgementNumber() !== this.$$sequenceNumberNext) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.HANDSHAKE_C_WAIT);
                break;
            case Socket.HANDSHAKE_B_SENT:
                if (!rxSegment.isHandshakeAck() || rxSegment.getAcknowledgementNumber() !== this.$$sequenceNumberNext) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.ESTABLISHED);
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
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.HANDSHAKE_A_IN_PROGRESS);
                break;
            case Socket.HANDSHAKE_B_WAIT:
                txSegment = Segment.handshakeSynAck(this.$$acknowledgementNumberForLastRxSegment);
                this.$$initialSequenceNumber = txSegment.getSequenceNumber();
                this.$$sequenceNumber = this.$$initialSequenceNumber;
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.HANDSHAKE_B_IN_PROGRESS);
                break;
            case Socket.HANDSHAKE_C_WAIT:
                txSegment = Segment.handshakeAck(this.$$sequenceNumberNext, this.$$acknowledgementNumberForLastRxSegment);
                this.$$sequenceNumber = this.$$sequenceNumberNext;
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.HANDSHAKE_C_IN_PROGRESS);
                break;
        }

        if (txSegment) {
            this.$$txSegmentCurrent = txSegment;
        }

        return txSegment;
    };

    Socket.prototype.$$updateState = function (newState) {
        this.$$state = newState;
        this.$$socketClient.onSocketStateChange(this.$$state);
    };

    return Socket;
})();
