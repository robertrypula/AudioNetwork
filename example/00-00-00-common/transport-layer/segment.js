// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// TODO move magic numbers to constants

var Segment = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var Segment;

    Segment = function (synchronizeFlag, sequenceNumber, acknowledgementFlag, acknowledgementNumber, payload) {
        this.$$synchronizeFlag = !!synchronizeFlag;
        this.$$sequenceNumber = sequenceNumber & 0x7f;
        this.$$acknowledgementFlag = !!acknowledgementFlag;
        this.$$acknowledgementNumber = acknowledgementNumber & 0x7f;
        this.$$payload = payload.slice(0);

        this.$$txFrameId = null;
    };

    Segment.HEADER_BYTE_LENGTH = 2;
    Segment.NOT_ENOUGH_BYTES_TO_CREATE_SEGMENT_EXCEPTION = 'Not enough bytes to create segment';

    Segment.SYNCHRONIZE_FLAG_ENABLED = true;
    Segment.SYNCHRONIZE_FLAG_DISABLED = false;
    Segment.ACKNOWLEDGEMENT_FLAG_ENABLED = true;
    Segment.ACKNOWLEDGEMENT_FLAG_DISABLED = false;
    Segment.ACKNOWLEDGEMENT_NUMBER_ZERO = 0;
    Segment.SYNCHRONIZE_VIRTUAL_PAYLOAD_LENGTH = 1;

    Segment.prototype.getHeaderLog = function () {
        var log = [];

        this.$$synchronizeFlag ? log.push('SYN') : undefined;
        this.$$acknowledgementFlag ? log.push('ACK') : undefined;
        log.push('sn=' + this.$$sequenceNumber);
        log.push('an=' + this.$$acknowledgementNumber);

        return '[' + log.join(',') + ']';
    };

    Segment.prototype.getSequenceNumber = function () {
        return this.$$sequenceNumber;
    };

    Segment.prototype.getAcknowledgementNumber = function () {
        return this.$$acknowledgementNumber;
    };

    Segment.prototype.setTxFrameId = function (txFrameId) {
        this.$$txFrameId = txFrameId;
    };

    Segment.prototype.getPayload = function () {
        return this.$$payload;
    };

    Segment.prototype.getTxFrameId = function () {
        return this.$$txFrameId;
    };

    Segment.prototype.getTxFramePayload = function () {
        var
            txFramePayload = [],
            headerByteA,
            headerByteB,
            i;

        headerByteA = (this.$$synchronizeFlag ? 0x80 : 0x00) | this.$$sequenceNumber;
        txFramePayload.push(headerByteA);
        headerByteB = (this.$$acknowledgementFlag ? 0x80 : 0x00) | this.$$acknowledgementNumber;
        txFramePayload.push(headerByteB);

        for (i = 0; i < this.$$payload.length; i++) {
            txFramePayload.push(this.$$payload[i]);
        }

        return txFramePayload;
    };

    Segment.fromRxFramePayload = function (rxFramePayload) {
        var
            synchronizeFlag,
            sequenceNumber,
            acknowledgementFlag,
            acknowledgementNumber,
            payload = [],
            i;

        if (rxFramePayload.length < Segment.HEADER_BYTE_LENGTH) {
            throw Segment.NOT_ENOUGH_BYTES_TO_CREATE_SEGMENT_EXCEPTION;
        }

        synchronizeFlag = !!(rxFramePayload[0] & 0x80);
        sequenceNumber = rxFramePayload[0] & 0x7f;
        acknowledgementFlag = !!(rxFramePayload[1] & 0x80);
        acknowledgementNumber = rxFramePayload[1] & 0x7f;

        for (i = 2; i < rxFramePayload.length; i++) {
            payload.push(rxFramePayload[i]);
        }

        return new Segment(
            synchronizeFlag,
            sequenceNumber,
            acknowledgementFlag,
            acknowledgementNumber,
            payload
        );
    };

    Segment.prototype.isHandshakeSyn = function () {
        return this.$$synchronizeFlag &&
            !this.$$acknowledgementFlag &&
            this.$$acknowledgementNumber === Segment.ACKNOWLEDGEMENT_NUMBER_ZERO &&
            this.$$payload.length === 0;
    };

    Segment.prototype.isHandshakeSynAck = function () {
        return this.$$synchronizeFlag &&
            this.$$acknowledgementFlag &&
            this.$$payload.length === 0;
    };

    Segment.prototype.isHandshakeAck = function () {
        return this.isDataAck(); // there is no difference
    };

    Segment.prototype.isData = function () {
        return !this.$$synchronizeFlag &&
            this.$$acknowledgementFlag &&
            this.$$payload.length > 0;
    };

    Segment.prototype.isDataAck = function () {
        return !this.$$synchronizeFlag &&
            this.$$acknowledgementFlag &&
            this.$$payload.length === 0;
    };

    Segment.prototype.getSequenceNumberNext = function () {
        var sequenceNumberNext = this.$$synchronizeFlag
            ? this.$$sequenceNumber + Segment.SYNCHRONIZE_VIRTUAL_PAYLOAD_LENGTH
            : this.$$sequenceNumber + this.$$payload.length;

        sequenceNumberNext = sequenceNumberNext % 0x80;

        return sequenceNumberNext;
    };

    Segment.prototype.getAcknowledgementNumberForLastRxSegment = function () {
        return this.getSequenceNumberNext();
    };

    Segment.prototype.getAcknowledgementNumberForLastRxSegmentPrevious = function (acknowledgementNumberForLastRxSegment) {
        return (acknowledgementNumberForLastRxSegment - this.$$payload.length + 0x80) % 0x80;
    };

    Segment.handshakeSyn = function () {
        return new Segment(
            Segment.SYNCHRONIZE_FLAG_ENABLED,
            Segment.generateInitialSequenceNumber(),
            Segment.ACKNOWLEDGEMENT_FLAG_DISABLED,
            Segment.ACKNOWLEDGEMENT_NUMBER_ZERO,
            []
        );
    };

    Segment.handshakeSynAck = function (acknowledgementNumber) {
        return new Segment(
            Segment.SYNCHRONIZE_FLAG_ENABLED,
            Segment.generateInitialSequenceNumber(),
            Segment.ACKNOWLEDGEMENT_FLAG_ENABLED,
            acknowledgementNumber,
            []
        );
    };

    Segment.handshakeAck = function (sequenceNumber, acknowledgementNumber) {
        return Segment.dataAck(sequenceNumber, acknowledgementNumber); // there is no difference
    };

    Segment.data = function (sequenceNumber, acknowledgementNumber, payload) {
        return new Segment(
            Segment.SYNCHRONIZE_FLAG_DISABLED,
            sequenceNumber,
            Segment.ACKNOWLEDGEMENT_FLAG_ENABLED,
            acknowledgementNumber,
            payload
        );
    };

    Segment.dataAck = function (sequenceNumber, acknowledgementNumber) {
        return new Segment(
            Segment.SYNCHRONIZE_FLAG_DISABLED,
            sequenceNumber,
            Segment.ACKNOWLEDGEMENT_FLAG_ENABLED,
            acknowledgementNumber,
            []
        );
    };

    Segment.generateInitialSequenceNumber = function () {
        return (Math.random() * 0x80) & 0x7f;
    };

    return Segment;
})();
