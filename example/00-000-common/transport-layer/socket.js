// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Socket = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var Socket;

    Socket = function (segmentPayloadLengthLimit) {
        this.$$segmentPayloadLengthLimit = segmentPayloadLengthLimit;
        this.$$state = Socket.CLOSED;

        this.$$initialSequenceNumber = 0;
        this.$$sequenceNumber = 0;

        this.$$rxDataChunk = [];
        this.$$txDataChunk = [];
    };

    Socket.CLOSED = 'CLOSED';
    Socket.LISTEN = 'LISTEN';
    Socket.SYN_SENT = 'C_SYN_SENT';
    Socket.SYN_RECEIVED = 'SYN_RECEIVED';
    Socket.ESTABLISHED = 'ESTABLISHED';

    Socket.prototype.txData = function (data) {
        this.$$splitIntoTxDataChunk(data);
    };

    Socket.prototype.tick = function () {
        
    };

    Socket.prototype.getTxSegment = function () {

    };

    Socket.prototype.handleRxSegment = function (rxSegment) {

    };

    Socket.prototype.$$splitIntoTxDataChunk = function (data) {
        var
            isDataChunkCompleted,
            payload,
            dataChunk,
            i;

        payload = [];
        for (i = 0; i < data.length; i++) {
            payload.push(data[i]);

            isDataChunkCompleted =
                (i % this.$$segmentPayloadLengthLimit) === (this.$$segmentPayloadLengthLimit - 1) ||
                i === (data.length - 1);

            if (isDataChunkCompleted) {
                dataChunk = new DataChunk(payload);
                this.$$txDataChunk.push(dataChunk);
                payload = [];
            }
        }
    };

    return Socket;
})();
