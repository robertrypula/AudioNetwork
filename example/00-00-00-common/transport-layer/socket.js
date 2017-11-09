// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Socket = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var Socket;

    Socket = function (segmentPayloadLengthLimit) {
        this.$$segmentPayloadLengthLimit = segmentPayloadLengthLimit;
        this.$$state = Socket.ESTABLISHED;   // TODO move to closed

        this.$$initialSequenceNumber = 0;
        this.$$sequenceNumber = 0;
        this.$$acknowledgementNumber = 0;

        this.$$dataChunkActiveIndex = 0;
        this.$$dataChunk = [];
    };

    Socket.CLOSED = 'CLOSED';
    Socket.LISTEN = 'LISTEN';
    Socket.SYN_SENT = 'C_SYN_SENT';
    Socket.SYN_RECEIVED = 'SYN_RECEIVED';
    Socket.ESTABLISHED = 'ESTABLISHED';

    Socket.RETRANSMISSION_LIMIT = 5;

    Socket.LOGIC_ERROR_EXCEPTION = 'LOGIC_ERROR_EXCEPTION';

    Socket.prototype.addTxData = function (txData) {
        this.$$addAsTxDataChunk(txData);
    };
    
    Socket.prototype.findTxSegmentByTxFrameId = function (txFrameId) {
        var
            activeDataChunk = this.$$getActiveDataChunk(),
            txSegment;

        if (!activeDataChunk) {
            // throw Socket.LOGIC_ERROR_EXCEPTION;
            return null;
        }

        txSegment = activeDataChunk.getLastTxSegment();

        if (!txSegment) {
            // throw Socket.LOGIC_ERROR_EXCEPTION;
            return null;
        }

        if (txSegment.getTxFrameId() !== txFrameId) {
            // throw Socket.LOGIC_ERROR_EXCEPTION;
            return null;
        }

        return txSegment;
    };

    Socket.prototype.getTxSegment = function (txSymbolId) {
        var
            activeDataChunk = this.$$getActiveDataChunk(),
            lastTxSegment,
            txSegment = null;

        if (this.$$state === Socket.CLOSED) {
            return;
        }

        if (!activeDataChunk) {
            return null;
        }

        if (activeDataChunk.isLastTxSegmentInProgress()) {
            return null;
        }

        if (activeDataChunk.txSegmentLength() > Socket.RETRANSMISSION_LIMIT) {
            this.$$state = Socket.CLOSED;
            return null;
        }

        lastTxSegment = activeDataChunk.getLastTxSegment();

        if (!lastTxSegment || lastTxSegment.getTxSymbolId() + 21 <= txSymbolId) {  // TODO fix hardcoded value
            txSegment = new Segment(false, this.$$sequenceNumber, true, this.$$acknowledgementNumber, activeDataChunk.getPayload());
            txSegment.setTxSymbolId(txSymbolId);
            activeDataChunk.addTxSegment(txSegment);
        }

        return txSegment;
    };

    Socket.prototype.handleRxSegment = function (rxSegment) {
        var
            activeDataChunk = this.$$getActiveDataChunk(),
            dataChunk,
            payload;

        if (this.$$state === Socket.CLOSED) {
            return;
        }

        if (!activeDataChunk) {
            payload = rxSegment.getPayload();
            dataChunk = new DataChunk(payload);
            this.$$dataChunk.push(dataChunk);
            return;
        }

        if (activeDataChunk.isLastTxSegmentInProgress()) {
            return;
        }

    };

    Socket.prototype.$$getActiveDataChunk = function () {
        if (this.$$dataChunkActiveIndex >= this.$$dataChunk.length) {
            return null;
        }

        return this.$$dataChunk[this.$$dataChunkActiveIndex];
    };

    Socket.prototype.$$addAsTxDataChunk = function (txData) {
        var
            isDataChunkCompleted,
            payload,
            dataChunk,
            i;

        payload = [];
        for (i = 0; i < txData.length; i++) {
            payload.push(txData[i]);

            isDataChunkCompleted =
                (i % this.$$segmentPayloadLengthLimit) === (this.$$segmentPayloadLengthLimit - 1) ||
                i === (txData.length - 1);

            if (isDataChunkCompleted) {
                dataChunk = new DataChunk(payload);
                this.$$dataChunk.push(dataChunk);
                payload = [];
            }
        }
    };

    return Socket;
})();
