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
        this.$$txSegmentHistory = [];
        this.$$txSegmentCurrent = null;

        this.$$txDataChunkHistory = [];
        this.$$txDataChunkCurrent = null;
        this.$$txDataChunkQueue = [];

        this.$$state = undefined;
        this.$$updateState(Socket.CLOSED);
    };

    Socket.SENDING_IS_POSSIBLE_ONLY_IN_ESTABLISHED_STATE_EXCEPTION = 'Sending is possible only in ESTABLISHED state';

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
    Socket.DATA_CHUNK_WAIT = 'DATA_CHUNK_WAIT';
    Socket.DATA_CHUNK_IN_PROGRESS = 'DATA_CHUNK_IN_PROGRESS';
    Socket.DATA_CHUNK_SENT = 'DATA_CHUNK_SENT';

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

    Socket.prototype.send = function (txData) {
        if (this.$$state !== Socket.ESTABLISHED) {
            throw Socket.SENDING_IS_POSSIBLE_ONLY_IN_ESTABLISHED_STATE_EXCEPTION;
        }

        this.$$splitIntoTxDataChunk(txData);
        this.$$updateState(Socket.DATA_CHUNK_WAIT);
    };

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
            case Socket.DATA_CHUNK_IN_PROGRESS:
                this.$$updateState(Socket.DATA_CHUNK_SENT);
                break;
        }


        this.$$txSegmentHistory.push(this.$$txSegmentCurrent);
        this.$$txSegmentCurrent = null;
    };

    Socket.prototype.handleRxSegment = function (rxSegment) {
        console.log('handleRxSegment', rxSegment, rxSegment.getHeaderLog());
        switch (this.$$state) {
            // SERVER
            case Socket.LISTEN:
                if (!rxSegment.isHandshakeSyn()) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.HANDSHAKE_B_WAIT);
                break;
            case Socket.HANDSHAKE_B_SENT:
                if (!rxSegment.isHandshakeAck() || rxSegment.getAcknowledgementNumber() !== this.$$sequenceNumberNext) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.ESTABLISHED);
                break;
            case Socket.ESTABLISHED:
                // TODO implement
                /*
                if (!rxSegment.isData() || rxSegment.getAcknowledgementNumber() !== this.$$sequenceNumberNext) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.ESTABLISHED);
                */
                break;

            // CLIENT
            case Socket.HANDSHAKE_A_SENT:
                if (!rxSegment.isHandshakeSynAck() || rxSegment.getAcknowledgementNumber() !== this.$$sequenceNumberNext) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.HANDSHAKE_C_WAIT);
                break;
        }
    };

    Socket.prototype.getTxSegment = function () {
        var
            txSegment = null,
            payload;

        switch (this.$$state) {
            // CLIENT
            case Socket.HANDSHAKE_A_WAIT:
                txSegment = Segment.handshakeSyn();
                this.$$initialSequenceNumber = txSegment.getSequenceNumber();
                this.$$sequenceNumber = this.$$initialSequenceNumber;
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.HANDSHAKE_A_IN_PROGRESS);
                break;
            case Socket.HANDSHAKE_C_WAIT:
                this.$$sequenceNumber = this.$$sequenceNumberNext;
                txSegment = Segment.handshakeAck(this.$$sequenceNumber, this.$$acknowledgementNumberForLastRxSegment);
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.HANDSHAKE_C_IN_PROGRESS);
                break;
            case Socket.DATA_CHUNK_WAIT:
                this.$$sequenceNumber = this.$$sequenceNumberNext;
                this.$$txDataChunkCurrent = this.$$txDataChunkQueue.shift();
                payload = this.$$txDataChunkCurrent.getPayload();
                txSegment = Segment.data(this.$$sequenceNumber, this.$$acknowledgementNumberForLastRxSegment, payload);
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.DATA_CHUNK_IN_PROGRESS);
                break;

            // SERVER
            case Socket.HANDSHAKE_B_WAIT:
                txSegment = Segment.handshakeSynAck(this.$$acknowledgementNumberForLastRxSegment);
                this.$$initialSequenceNumber = txSegment.getSequenceNumber();
                this.$$sequenceNumber = this.$$initialSequenceNumber;
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.HANDSHAKE_B_IN_PROGRESS);
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

    Socket.prototype.$$splitIntoTxDataChunk = function (txData) {
        var
            isDataChunkPayloadReady,
            isLastByteInDataChunk,
            isLastByteInTxData,
            txDataChunk,
            payload,
            i;

        payload = [];
        for (i = 0; i < txData.length; i++) {
            payload.push(txData[i]);

            isLastByteInDataChunk = (i % this.$$segmentPayloadLengthLimit) === (this.$$segmentPayloadLengthLimit - 1);
            isLastByteInTxData = i === (txData.length - 1);

            isDataChunkPayloadReady = isLastByteInDataChunk || isLastByteInTxData;
            if (isDataChunkPayloadReady) {
                txDataChunk = new DataChunk(payload);
                this.$$txDataChunkQueue.push(txDataChunk);
                payload = [];
            }
        }
    };

    return Socket;
})();
