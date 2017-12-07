// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// NOTE: this class was written in a hurry to meet deadline and might have some big issues

var Socket = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var Socket;

    Socket = function (socketClient, segmentPayloadLengthLimit) {
        this.$$segmentPayloadLengthLimit = segmentPayloadLengthLimit;
        this.$$socketClient = socketClient;

        this.$$initialSequenceNumber = undefined;
        this.$$sequenceNumber = undefined;
        this.$$sequenceNumberNext = undefined;
        this.$$acknowledgementNumberForLastRxSegment = undefined;

        this.$$txSegmentCurrent = null;
        this.$$txDataChunkCurrent = null;
        this.$$txDataChunkQueue = [];

        this.$$rxDataChunk = [];

        this.$$rxSegmentId = 1;
        this.$$txSegmentId = 1;

        this.$$state = undefined;
        this.$$updateState(Socket.CLOSED);

        this.$$handshakeResponseDelay = 0;
        this.$$dataChunkResponseDelay = 0;
        this.$$dataChunkRetransmissionCount = 0;
    };

    Socket.SENDING_IS_POSSIBLE_ONLY_IN_ESTABLISHED_STATE_EXCEPTION = 'Sending is possible only in ESTABLISHED state';
    Socket.THERE_IS_NOTHING_TO_SEND_EXCEPTION = 'There is nothing to send';
    Socket.STATE_TO_REAL_TCP_STATE_MAPPING_FAILED_EXCEPTION = 'State to real TCP state mapping failed';

    // TODO: find better names for states (?)
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
    Socket.DATA_CHUNK_RECEIVED_ACT_WAIT = 'DATA_CHUNK_RECEIVED_ACT_WAIT';
    Socket.DATA_CHUNK_RECEIVED_ACT_IN_PROGRESS = 'DATA_CHUNK_RECEIVED_ACT_IN_PROGRESS';

    Socket.REAL_TCP_CLOSED = 'CLOSED';
    Socket.REAL_TCP_LISTEN = 'LISTEN';
    Socket.REAL_TCP_SYN_SENT = 'SYN_SENT';
    Socket.REAL_TCP_SYN_RECEIVED = 'SYN_RECEIVED';
    Socket.REAL_TCP_ESTABLISHED = 'ESTABLISHED';

    Socket.HANDSHAKE_RESPONSE_DELAY_LIMIT = 15;
    Socket.DATA_CHUNK_RESPONSE_DELAY_LIMIT = 15;
    Socket.DATA_CHUNK_RETRANSMISSION_COUNT_LIMIT = 5;

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
        if (!txData || txData.length === 0) {
            throw Socket.THERE_IS_NOTHING_TO_SEND_EXCEPTION;
        }
        if (this.$$state !== Socket.ESTABLISHED) {
            throw Socket.SENDING_IS_POSSIBLE_ONLY_IN_ESTABLISHED_STATE_EXCEPTION;
        }

        this.$$splitIntoTxDataChunk(txData);
        this.$$updateState(Socket.DATA_CHUNK_WAIT);
    };

    Socket.prototype.handleRxSegment = function (rxSegment) {
        var
            isReceiveBlocked = this.$$socketClient.isReceiveBlocked(),
            receivedFreshDataChunk,
            rxDataChunk;

        // console.log('------------------------------------------');
        // console.log(this.$$state);
        // console.log(isReceiveBlocked ? 'receive blocked!!!' : 'receive ok');
        // console.log('handleRxSegment', rxSegment, rxSegment.getHeaderLog());

        if (isReceiveBlocked) {
            return;
        }

        // TODO clean this giant switch below as this is not following clean code principles

        switch (this.$$state) {
            // SERVER
            case Socket.LISTEN:
                // console.log('----');
                // console.log('Expecting handshake SYN', rxSegment.isHandshakeSyn());
                // console.log('Got seq', rxSegment.getSequenceNumber(), 'no expectation.............', this.$$acknowledgementNumberForLastRxSegment);
                // console.log('Got ack', rxSegment.getAcknowledgementNumber(), 'no expectation.............', this.$$sequenceNumberNext);
                if (!rxSegment.isHandshakeSyn()) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.HANDSHAKE_B_WAIT);
                break;
            case Socket.HANDSHAKE_B_SENT:
                // console.log('----');
                // console.log('Expecting handshake ack', rxSegment.isHandshakeAck());
                // console.log('Got seq', rxSegment.getSequenceNumber(), 'expecting', this.$$acknowledgementNumberForLastRxSegment);
                // console.log('Got ack', rxSegment.getAcknowledgementNumber(), 'expecting', this.$$sequenceNumberNext);
                if (!rxSegment.isHandshakeAck() || rxSegment.getSequenceNumber() !== this.$$acknowledgementNumberForLastRxSegment || rxSegment.getAcknowledgementNumber() !== this.$$sequenceNumberNext) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.ESTABLISHED);
                break;
            case Socket.ESTABLISHED:
                // console.log('----');
                // console.log('Expecting data', rxSegment.isData());
                // console.log('Got seq', rxSegment.getSequenceNumber(), 'expecting', this.$$acknowledgementNumberForLastRxSegment, 'or', rxSegment.getAcknowledgementNumberForLastRxSegmentPrevious(this.$$acknowledgementNumberForLastRxSegment));
                // console.log('Got ack', rxSegment.getAcknowledgementNumber(), 'expecting', this.$$sequenceNumberNext);
                if (
                    !rxSegment.isData() ||
                    (
                        rxSegment.getSequenceNumber() !== this.$$acknowledgementNumberForLastRxSegment &&
                        rxSegment.getSequenceNumber() !== rxSegment.getAcknowledgementNumberForLastRxSegmentPrevious(this.$$acknowledgementNumberForLastRxSegment)
                    ) ||
                    rxSegment.getAcknowledgementNumber() !== this.$$sequenceNumberNext
                ) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.DATA_CHUNK_RECEIVED_ACT_WAIT);

                rxDataChunk = this.$$getLastRxDataChunk();
                receivedFreshDataChunk =
                    !rxDataChunk ||
                    (rxDataChunk && rxDataChunk.getLastRxSegment().getSequenceNumber() !== rxSegment.getSequenceNumber());
                if (receivedFreshDataChunk) {
                    // TODO implement payload check - retransmitted segments should have the same payload
                    // TODO it would be nice to handle that case

                    rxDataChunk = new DataChunk(rxSegment.getPayload());
                    rxDataChunk.addRxSegment(rxSegment);
                    this.$$rxDataChunk.push(rxDataChunk);
                    this.$$socketClient.onRxDataChunk(this.$$rxDataChunk);
                } else {
                    rxDataChunk.addRxSegment(rxSegment);
                }

                break;

            // CLIENT
            case Socket.HANDSHAKE_A_SENT:
                // console.log('----');
                // console.log('Expecting handshake syn ack', rxSegment.isHandshakeSynAck());
                // console.log('Got seq', rxSegment.getSequenceNumber(), 'no expectation..........', this.$$acknowledgementNumberForLastRxSegment);
                // console.log('Got ack', rxSegment.getAcknowledgementNumber(), 'expecting', this.$$sequenceNumberNext);
                if (!rxSegment.isHandshakeSynAck() || rxSegment.getAcknowledgementNumber() !== this.$$sequenceNumberNext) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();
                this.$$updateState(Socket.HANDSHAKE_C_WAIT);
                break;
            case Socket.DATA_CHUNK_SENT:
                // console.log('----');
                // console.log('Expecting data ack', rxSegment.isDataAck());
                // console.log('Got seq', rxSegment.getSequenceNumber(), 'expecting', this.$$acknowledgementNumberForLastRxSegment);
                // console.log('Got ack', rxSegment.getAcknowledgementNumber(), 'expecting', this.$$sequenceNumberNext);
                if (!rxSegment.isDataAck() || rxSegment.getSequenceNumber() !== this.$$acknowledgementNumberForLastRxSegment || rxSegment.getAcknowledgementNumber() !== this.$$sequenceNumberNext) {
                    break;
                }
                this.$$acknowledgementNumberForLastRxSegment = rxSegment.getAcknowledgementNumberForLastRxSegment();

                this.$$socketClient.onTxDataChunk(this.$$txDataChunkCurrent);

                if (this.$$txDataChunkQueue.length > 0) {
                    this.$$updateState(Socket.DATA_CHUNK_WAIT);
                } else {
                    this.$$updateState(Socket.ESTABLISHED);
                }
                break;
        }
    };

    Socket.prototype.getTxSegment = function () {
        var
            txSegment = null,
            payload;

        // console.log('--------------------------------------------------');
        // console.log('TX SEGMENT');
        // console.log(getPrettyDateTime(new Date()), this.$$state, this.$$initialSequenceNumber);

        switch (this.$$state) {
            // CLIENT
            case Socket.HANDSHAKE_A_WAIT:
                txSegment = Segment.handshakeSyn();
                this.$$initialSequenceNumber = txSegment.getSequenceNumber();
                this.$$sequenceNumber = this.$$initialSequenceNumber;
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.HANDSHAKE_A_IN_PROGRESS);
                break;
            case Socket.HANDSHAKE_A_SENT:
                if (this.$$handshakeResponseDelay++ > Socket.HANDSHAKE_RESPONSE_DELAY_LIMIT) {
                    this.$$updateState(Socket.CLOSED);
                }
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
                this.$$dataChunkRetransmissionCount = 0;
                txSegment = Segment.data(this.$$sequenceNumber, this.$$acknowledgementNumberForLastRxSegment, payload);
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.DATA_CHUNK_IN_PROGRESS);
                break;
            case Socket.DATA_CHUNK_SENT:
                if (this.$$dataChunkResponseDelay++ > Socket.DATA_CHUNK_RESPONSE_DELAY_LIMIT) {
                    if (this.$$dataChunkRetransmissionCount++ >= Socket.DATA_CHUNK_RETRANSMISSION_COUNT_LIMIT) {
                        this.$$updateState(Socket.CLOSED);
                        break;
                    }
                    // retransmission
                    payload = this.$$txDataChunkCurrent.getPayload();
                    txSegment = Segment.data(this.$$sequenceNumber, this.$$acknowledgementNumberForLastRxSegment, payload);
                    this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                    this.$$updateState(Socket.DATA_CHUNK_IN_PROGRESS);
                }
                break;

            // SERVER
            case Socket.HANDSHAKE_B_WAIT:
                txSegment = Segment.handshakeSynAck(this.$$acknowledgementNumberForLastRxSegment);
                this.$$initialSequenceNumber = txSegment.getSequenceNumber();
                this.$$sequenceNumber = this.$$initialSequenceNumber;
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.HANDSHAKE_B_IN_PROGRESS);
                break;
            case Socket.HANDSHAKE_B_SENT:
                if (this.$$handshakeResponseDelay++ > Socket.HANDSHAKE_RESPONSE_DELAY_LIMIT) {
                    this.$$updateState(Socket.CLOSED);
                }
                break;
            case Socket.DATA_CHUNK_RECEIVED_ACT_WAIT:
                this.$$sequenceNumber = this.$$sequenceNumberNext;
                txSegment = Segment.dataAck(this.$$sequenceNumber, this.$$acknowledgementNumberForLastRxSegment);
                this.$$sequenceNumberNext = txSegment.getSequenceNumberNext();
                this.$$updateState(Socket.DATA_CHUNK_RECEIVED_ACT_IN_PROGRESS);
                break;
        }

        if (txSegment) {
            this.$$txSegmentCurrent = txSegment;
        } else {
            txSegment = this.$$txSegmentCurrent;
        }

        return txSegment;
    };

    Socket.prototype.txSegmentSent = function () {
        // console.log('--------------------------------------------------');
        // console.log('TX SEGMENT SENT');
        // console.log(getPrettyDateTime(new Date()), this.$$state, this.$$initialSequenceNumber);

        switch (this.$$state) {
            // CLIENT
            case Socket.HANDSHAKE_A_IN_PROGRESS:
                this.$$updateState(Socket.HANDSHAKE_A_SENT);
                this.$$handshakeResponseDelay = 0;
                break;
            case Socket.HANDSHAKE_C_IN_PROGRESS:
                this.$$updateState(Socket.ESTABLISHED);
                break;
            case Socket.DATA_CHUNK_IN_PROGRESS:
                this.$$updateState(Socket.DATA_CHUNK_SENT);
                this.$$dataChunkResponseDelay = 0;
                break;

            // SERVER
            case Socket.HANDSHAKE_B_IN_PROGRESS:
                this.$$updateState(Socket.HANDSHAKE_B_SENT);
                this.$$handshakeResponseDelay = 0;
                break;
            case Socket.DATA_CHUNK_RECEIVED_ACT_IN_PROGRESS:
                this.$$updateState(Socket.ESTABLISHED);
                break;
        }

        this.$$txSegmentCurrent = null;
    };

    Socket.prototype.getNextRxSegmentId = function () {
        return this.$$rxSegmentId++;
    };

    Socket.prototype.getNextTxSegmentId = function () {
        return this.$$txSegmentId++;
    };

    Socket.prototype.$$updateState = function (newState) {
        var connectionStatus;

        this.$$state = newState;
        connectionStatus = {
            state: this.$$state,
            realTcpState: Socket.mapStateToRealTcpState(this.$$state),
            initialSequenceNumber: this.$$initialSequenceNumber
        };
        this.$$socketClient.onSocketStateChange(connectionStatus);
    };

    Socket.prototype.$$getLastRxDataChunk = function () {
        return this.$$rxDataChunk.length > 0
            ? this.$$rxDataChunk[this.$$rxDataChunk.length - 1]
            : null;
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

    Socket.mapStateToRealTcpState = function (state) {
        switch (state) {
            case Socket.CLOSED:
                return Socket.REAL_TCP_CLOSED;
            case Socket.LISTEN:
            case Socket.HANDSHAKE_A_WAIT:
            case Socket.HANDSHAKE_A_IN_PROGRESS:
                return Socket.REAL_TCP_LISTEN;
            case Socket.HANDSHAKE_A_SENT:
                return Socket.REAL_TCP_SYN_SENT;
            case Socket.HANDSHAKE_B_WAIT:
            case Socket.HANDSHAKE_B_IN_PROGRESS:
            case Socket.HANDSHAKE_B_SENT:
                return Socket.REAL_TCP_SYN_RECEIVED;
            case Socket.HANDSHAKE_C_WAIT:
            case Socket.HANDSHAKE_C_IN_PROGRESS:
            case Socket.HANDSHAKE_C_SENT:
            case Socket.ESTABLISHED:
            case Socket.DATA_CHUNK_WAIT:
            case Socket.DATA_CHUNK_IN_PROGRESS:
            case Socket.DATA_CHUNK_SENT:
            case Socket.DATA_CHUNK_RECEIVED_ACT_WAIT:
            case Socket.DATA_CHUNK_RECEIVED_ACT_IN_PROGRESS:
                return Socket.REAL_TCP_ESTABLISHED;
        }

        throw Socket.STATE_TO_REAL_TCP_STATE_MAPPING_FAILED_EXCEPTION;
    };

    return Socket;
})();
