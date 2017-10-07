// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Frame;

Frame = function () {
    this.header = undefined;
    this.payload = [];
    this.checksum = undefined;
};

Frame.PAYLOAD_TYPE_COMMAND = 'PAYLOAD_TYPE_COMMAND';
Frame.PAYLOAD_TYPE_DATA = 'PAYLOAD_TYPE_DATA';
Frame.$$_HEADER_FRAME_START_MARKER = 0xE0;
Frame.$$_HEADER_RESERVED_BIT = 0x08;
Frame.$$_HEADER_COMMAND_BIT_SET = 0x10;
Frame.$$_HEADER_COMMAND_BIT_NOT_SET = 0x00;
Frame.$$_HEADER_PAYLOAD_LENGTH_MASK = 0x0F;

Frame.prototype.getHeader = function () {
    return this.header;
};

Frame.prototype.getPayload = function () {
    return this.payload;
};

Frame.prototype.getChecksum = function () {
    return this.checksum;
};

Frame.prototype.setPayload = function (payload, payloadType) {
    var frameWithoutChecksum, frame, isCommand, header, checksum, i, byte;

    frameWithoutChecksum = [];
    isCommand = payloadType === Frame.PAYLOAD_TYPE_COMMAND;
    header = Frame.$$generateHeader(isCommand, payload.length);
    frameWithoutChecksum.push(header);
    for (i = 0; i < payload.length; i++) {
        byte = payload[i] & DataLinkLayer.$$_ONE_BYTE_MASK;
        frameWithoutChecksum.push(byte);
    }
    checksum = Frame.$$computeChecksum(frameWithoutChecksum);

    frame = frameWithoutChecksum;
    frame.push(checksum);

    return frame;
};

Frame.$$computeChecksum = function (frameWithoutChecksum) {
    return ChecksumService.fletcher8(frameWithoutChecksum);
};

Frame.$$generateHeader = function (isCommand, payloadLength) {
    var frameStartMarker, commandBit, header;

    frameStartMarker = Frame.$$_HEADER_FRAME_START_MARKER;
    commandBit = isCommand
        ? Frame.$$_HEADER_COMMAND_BIT_SET
        : Frame.$$_HEADER_COMMAND_BIT_NOT_SET;
    payloadLength = Frame.$$_HEADER_PAYLOAD_LENGTH_MASK & payloadLength;

    header = frameStartMarker | commandBit | payloadLength;

    return header;
};
