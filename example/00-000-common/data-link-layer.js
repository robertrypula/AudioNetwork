// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var DataLinkLayerBuilder = function () {
    this._framePayloadLengthMax = 7;

    // data link layer listeners
    this._frameListener = undefined;
    this._frameCandidateListener = undefined;

    // physical layer listeners
    this._rxSymbolListener = undefined;
    this._rxSampleListener = undefined;
    this._rxSyncListener = undefined;
    this._rxConfigListener = undefined;
    this._configListener = undefined;
    this._txListener = undefined;
    this._txConfigListener = undefined;
};

DataLinkLayerBuilder.prototype.framePayloadLengthMax = function (framePayloadLengthMax) {
    this._framePayloadLengthMax = framePayloadLengthMax;
    return this;
};

DataLinkLayerBuilder.prototype.frameListener = function (frameListener) {
    this._frameListener = frameListener;
    return this;
};

DataLinkLayerBuilder.prototype.frameCandidateListener = function (frameCandidateListener) {
    this._frameCandidateListener = frameCandidateListener;
    return this;
};

DataLinkLayerBuilder.prototype.rxSymbolListener = function (listener) {
    this._rxSymbolListener = listener;
    return this;
};

DataLinkLayerBuilder.prototype.rxSampleListener = function (listener) {
    this._rxSampleListener = listener;
    return this;
};

DataLinkLayerBuilder.prototype.rxSyncListener = function (listener) {
    this._rxSyncListener = listener;
    return this;
};

DataLinkLayerBuilder.prototype.rxConfigListener = function (listener) {
    this._rxConfigListener = listener;
    return this;
};

DataLinkLayerBuilder.prototype.configListener = function (listener) {
    this._configListener = listener;
    return this;
};

DataLinkLayerBuilder.prototype.txListener = function (listener) {
    this._txListener = listener;
    return this;
};

DataLinkLayerBuilder.prototype.txConfigListener = function (listener) {
    this._txConfigListener = listener;
    return this;
};

DataLinkLayerBuilder.prototype.build = function () {
    return new DataLinkLayer(this);
};

// -----------------------------------------------------------------------------------------

var DataLinkLayer;

DataLinkLayer = function (builder) {
    // let's create network stack!
    // Data Link Layer hides Physical Layer inside
    this.$$physicalLayer = (new PhysicalLayerBuilder())
        .rxSymbolListener(this.$$rxSymbolListener.bind(this))
        .rxSampleListener(this.$$rxSampleListener.bind(this))
        .rxSyncListener(this.$$rxSyncListener.bind(this))
        .rxConfigListener(this.$$rxConfigListener.bind(this))
        .configListener(this.$$configListener.bind(this))
        .txListener(this.$$txListener.bind(this))
        .txConfigListener(this.$$txConfigListener.bind(this))
        .build();

    // general config
    this.$$framePayloadLengthMax = builder._framePayloadLengthMax;

    // state variables
    this.$$frame = undefined;
    this.$$frameId = DataLinkLayer.$$_INITIAL_ID;
    this.$$frameCandidateId = DataLinkLayer.$$_INITIAL_ID;
    this.$$frameCandidateList = [];

    // setup listeners - data link layer
    this.$$frameListener = DataLinkLayer.$$isFunction(builder._frameListener) ? builder._frameListener : null;
    this.$$frameCandidateListener = DataLinkLayer.$$isFunction(builder._frameCandidateListener) ? builder._frameCandidateListener : null;

    // setup listeners - physical layer
    this.$$externalRxSymbolListener = DataLinkLayer.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
    this.$$externalRxSampleListener = DataLinkLayer.$$isFunction(builder._rxSampleListener) ? builder._rxSampleListener : null;
    this.$$externalRxSyncListener = DataLinkLayer.$$isFunction(builder._rxSyncListener) ? builder._rxSyncListener : null;
    this.$$externalRxConfigListener = DataLinkLayer.$$isFunction(builder._rxConfigListener) ? builder._rxConfigListener : null;
    this.$$externalConfigListener = DataLinkLayer.$$isFunction(builder._configListener) ? builder._configListener : null;
    this.$$externalTxListener = DataLinkLayer.$$isFunction(builder._txListener) ? builder._txListener : null;
    this.$$externalTxConfigListener = DataLinkLayer.$$isFunction(builder._txConfigListener) ? builder._txConfigListener : null;
};

DataLinkLayer.PAYLOAD_TO_BIG_EXCEPTION = 'Payload is too big!';

DataLinkLayer.COMMAND_TWO_WAY_SYNC_44100 = 0;
DataLinkLayer.COMMAND_TWO_WAY_SYNC_48000 = 1;

DataLinkLayer.$$_HEADER_FRAME_START_MARKER = 0xE0;
DataLinkLayer.$$_HEADER_RESERVED_BIT = 0x08;
DataLinkLayer.$$_HEADER_COMMAND_BIT_SET = 0x10;
DataLinkLayer.$$_HEADER_COMMAND_BIT_NOT_SET = 0x00;
DataLinkLayer.$$_HEADER_PAYLOAD_LENGTH_MASK = 0x0F;
DataLinkLayer.$$_ONE_BYTE_MASK = 0xFF;

DataLinkLayer.$$_PAYLOAD_TYPE_COMMAND = 'PAYLOAD_TYPE_COMMAND';
DataLinkLayer.$$_PAYLOAD_TYPE_DATA = 'PAYLOAD_TYPE_DATA';

DataLinkLayer.$$_INITIAL_ID = 1;
DataLinkLayer.$$_HEADER_AND_CHECKSUM_BYTE_OVERHEAD = 2;

DataLinkLayer.prototype.getPhysicalLayer = function () {
    return this.$$physicalLayer;
};

DataLinkLayer.prototype.getRxSampleRate = function () {
    var rxConfig = this.$$physicalLayer.getRxConfig();

    return rxConfig.sampleRate;
};

DataLinkLayer.prototype.setTxSampleRate = function (txSampleRate) {
    this.$$physicalLayer.setTxSampleRate(txSampleRate);  // alias for easier access
};

DataLinkLayer.prototype.sendSync = function () {
    this.$$physicalLayer.sendSync();  // alias for easier access
};

DataLinkLayer.prototype.txTwoWaySync = function () {
    this.sendSync();
    switch (this.getRxSampleRate()) {
        case 44100:
            this.sendCommand(DataLinkLayer.COMMAND_TWO_WAY_SYNC_44100);
            break;
        case 48000:
            this.sendCommand(DataLinkLayer.COMMAND_TWO_WAY_SYNC_48000);
            break;
    }
};

DataLinkLayer.prototype.setLoopback = function (state) {
    this.$$physicalLayer.setLoopback(state);  // alias for easier access
};

DataLinkLayer.prototype.sendCommand = function (command) {
    var frame;

    frame = DataLinkLayer.$$buildFrame(DataLinkLayer.$$_PAYLOAD_TYPE_COMMAND, [command]);
    this.$$sendFrame(frame);
};

DataLinkLayer.prototype.sendFrame = function (payload) {
    var payloadType, frame;

    if (payload.length > this.$$framePayloadLengthMax) {
        throw DataLinkLayer.PAYLOAD_TO_BIG_EXCEPTION;
    }
    payloadType = DataLinkLayer.$$_PAYLOAD_TYPE_DATA;
    frame = DataLinkLayer.$$buildFrame(payloadType, payload);
    this.$$sendFrame(frame);
};

DataLinkLayer.prototype.getFrame = function () {
    var
        frame = this.$$frame,
        frameCopy;

    if (!frame) {
        return null;
    }

    frameCopy = {
        id: frame.id,
        header: frame.header,
        payload: frame.payload.slice(0),
        checksum: frame.checksum,
        isCommand: frame.isCommand,
        frameCandidateId: frame.frameCandidateId
    };

    return frameCopy;
};

DataLinkLayer.prototype.getFrameCandidate = function () {
    var i, frameCandidate, frameCandidateCopy, result = [];

    for (i = 0; i < this.$$frameCandidateList.length; i++) {
        frameCandidate = this.$$frameCandidateList[i];
        frameCandidateCopy = {
            id: frameCandidate.id,
            received: frameCandidate.received.slice(0),
            expected: frameCandidate.expected,
            isValid: frameCandidate.isValid,
            symbolId: frameCandidate.symbolId.slice(0)
        };
        result.push(frameCandidateCopy);
    }

    return result;
};

// -----------------------------------------------------

DataLinkLayer.prototype.$$handleRxSymbol = function (data) {
    var
        rxSample = this.$$physicalLayer.getRxSample(),
        rxConfig = this.$$physicalLayer.getRxConfig(),
        symbolMin = rxConfig.symbolMin,
        byte = (rxSample.symbolRaw - symbolMin) & DataLinkLayer.$$_ONE_BYTE_MASK,
        symbolId = data.id,
        isNewFrameAvailable,
        command;

    this.$$cleanUpFrameCandidateList();
    this.$$addSymbolRawToFrameCandidateList(byte, symbolId);
    this.$$tryToCreateNewFrameCandidate(byte, symbolId);
    isNewFrameAvailable = this.$$tryToFindNewFrame();

    // call listeners
    this.$$frameCandidateListener ? this.$$frameCandidateListener(this.getFrameCandidate()) : undefined;
    if (isNewFrameAvailable) {
        if (this.$$frame.isCommand) {
            command = this.$$frame.payload[0];
            this.$$handleReceivedCommand(command);
        }
        this.$$frameListener ? this.$$frameListener(this.getFrame()) : undefined;
    }
};

DataLinkLayer.prototype.$$cleanUpFrameCandidateList = function () {
    var i, frameCandidate, receivedFully;

    for (i = this.$$frameCandidateList.length - 1; i >= 0; i--) {
        frameCandidate = this.$$frameCandidateList[i];
        receivedFully = frameCandidate.received.length === frameCandidate.expected;
        if (receivedFully) {
            this.$$frameCandidateList.splice(i, 1);
        }
    }
};

DataLinkLayer.prototype.$$addSymbolRawToFrameCandidateList = function (byte, symbolId) {
    var i, frameCandidate, readyToComputeChecksum, fullyReceived, notFullyReceived, frameWithoutChecksum, receivedChecksum;

    for (i = 0; i < this.$$frameCandidateList.length; i++) {
        frameCandidate = this.$$frameCandidateList[i];
        notFullyReceived = frameCandidate.received.length < frameCandidate.expected;
        if (notFullyReceived) {
            frameCandidate.received.push(byte);
            frameCandidate.symbolId.push(symbolId);
        }

        readyToComputeChecksum = frameCandidate.received.length === (frameCandidate.expected - 1);
        if (readyToComputeChecksum) {
            frameWithoutChecksum = frameCandidate.received;
            frameCandidate.expectedChecksum = DataLinkLayer.$$computeChecksum(frameWithoutChecksum);
        }

        fullyReceived = frameCandidate.received.length === frameCandidate.expected;
        if (fullyReceived) {
            receivedChecksum = frameCandidate.received[frameCandidate.received.length - 1];
            frameCandidate.isValid = frameCandidate.expectedChecksum === receivedChecksum;
        }
    }
};

DataLinkLayer.prototype.$$tryToCreateNewFrameCandidate = function (byte, symbolId) {
    var frameCandidate, header, payloadLength;

    if (!DataLinkLayer.$$isValidHeader(byte)) {
        return;
    }
    header = byte;
    payloadLength = DataLinkLayer.$$getPayloadLength(header);

    frameCandidate = {
        id: this.$$frameCandidateId++,
        received: [header],
        expected: payloadLength + DataLinkLayer.$$_HEADER_AND_CHECKSUM_BYTE_OVERHEAD,
        isValid: false,
        expectedChecksum: null,
        symbolId: [symbolId]
    };
    this.$$frameCandidateList.push(frameCandidate);
};

DataLinkLayer.prototype.$$tryToFindNewFrame = function () {
    var i, frameCandidate;

    for (i = 0; i < this.$$frameCandidateList.length; i++) {
        frameCandidate = this.$$frameCandidateList[i];
        if (frameCandidate.isValid) {
            this.$$frame = DataLinkLayer.$$getFrameFromFrameCandidate(frameCandidate, this.$$frameId++);
            // there is possibility that there are more valid frames
            // but the assumption is that we are picking the biggest one only
            return true;
        }
    }

    return false;
};

DataLinkLayer.prototype.$$handleReceivedCommand = function (command) {
    switch (command) {
        case DataLinkLayer.COMMAND_TWO_WAY_SYNC_44100:
            this.setTxSampleRate(44100);
            this.sendSync();
            break;
        case DataLinkLayer.COMMAND_TWO_WAY_SYNC_48000:
            this.setTxSampleRate(48000);
            this.sendSync();
            break;
    }
};

// -----------------------------------------------------

DataLinkLayer.prototype.$$sendFrame = function (frame) {
    var txConfig, symbolMin, i, byte, symbol;

    txConfig = this.$$physicalLayer.getTxConfig();
    symbolMin = txConfig.symbolMin;
    for (i = 0; i < frame.length; i++) {
        byte = frame[i];
        symbol = symbolMin + byte;
        this.$$physicalLayer.sendSymbol(symbol);
    }
};

// -----------------------------------------------------

DataLinkLayer.prototype.$$rxSymbolListener = function (data) {
    this.$$externalRxSymbolListener ? this.$$externalRxSymbolListener(data) : undefined;
    this.$$handleRxSymbol(data);
};

DataLinkLayer.prototype.$$rxSampleListener = function (data) {
    this.$$externalRxSampleListener ? this.$$externalRxSampleListener(data) : undefined;
};

DataLinkLayer.prototype.$$rxSyncListener = function (data) {
    this.$$externalRxSyncListener ? this.$$externalRxSyncListener(data) : undefined;
};

DataLinkLayer.prototype.$$rxConfigListener = function (data) {
    this.$$externalRxConfigListener ? this.$$externalRxConfigListener(data) : undefined;
};

DataLinkLayer.prototype.$$configListener = function (data) {
    this.$$externalConfigListener ? this.$$externalConfigListener(data) : undefined;
};

DataLinkLayer.prototype.$$txListener = function (data) {
    this.$$externalTxListener ? this.$$externalTxListener(data) : undefined;
};

DataLinkLayer.prototype.$$txConfigListener = function (data) {
    this.$$externalTxConfigListener ? this.$$externalTxConfigListener(data) : undefined;
};

// -----------------------------------------------------

DataLinkLayer.$$getFrameFromFrameCandidate = function (frameCandidate, frameId) {
    var frame, header;

    header = frameCandidate.received[0];
    frame = {
        id: frameId,
        header: header,
        payload: frameCandidate.received.slice(1, frameCandidate.received.length - 1),
        checksum: frameCandidate.received[frameCandidate.received.length - 1],
        isCommand: DataLinkLayer.$$getIsCommand(header),
        frameCandidateId: frameCandidate.id
    };

    return frame;
};

DataLinkLayer.$$buildFrame = function (payloadType, payload) {
    var frame, isCommand, header, checksum, i, byte;

    frame = [];
    isCommand = payloadType === DataLinkLayer.$$_PAYLOAD_TYPE_COMMAND;
    header = DataLinkLayer.$$getHeader(isCommand, payload.length);
    frame.push(header);
    for (i = 0; i < payload.length; i++) {
        byte = payload[i] & DataLinkLayer.$$_ONE_BYTE_MASK;
        frame.push(byte);
    }
    checksum = DataLinkLayer.$$computeChecksum(frame);
    frame.push(checksum);

    return frame;
};

DataLinkLayer.$$getHeader = function (isCommand, payloadLength) {
    var header, frameStartMarker, commandBit;

    frameStartMarker = DataLinkLayer.$$_HEADER_FRAME_START_MARKER;
    commandBit = isCommand
        ? DataLinkLayer.$$_HEADER_COMMAND_BIT_SET
        : DataLinkLayer.$$_HEADER_COMMAND_BIT_NOT_SET;
    payloadLength = DataLinkLayer.$$_HEADER_PAYLOAD_LENGTH_MASK & payloadLength;

    header = frameStartMarker | commandBit | payloadLength;

    return header;
};

DataLinkLayer.$$isValidHeader = function (byte) {
    var frameStartMarkerAvailable, reservedBitNotSet;

    frameStartMarkerAvailable = (DataLinkLayer.$$_HEADER_FRAME_START_MARKER & byte) === DataLinkLayer.$$_HEADER_FRAME_START_MARKER;
    reservedBitNotSet = !(DataLinkLayer.$$_HEADER_RESERVED_BIT & byte);

    return frameStartMarkerAvailable && reservedBitNotSet;
};

DataLinkLayer.$$getPayloadLength = function (header) {
    return header & DataLinkLayer.$$_HEADER_PAYLOAD_LENGTH_MASK;
};

DataLinkLayer.$$getIsCommand = function (header) {
    return !!(header & DataLinkLayer.$$_HEADER_COMMAND_BIT_SET);
};

DataLinkLayer.$$computeChecksum = function (frameWithoutChecksum) {
    var sum1, sum2, i, isLeftHalfOfByte, byteNumber, byte, halfOfByte;

    sum1 = 0;
    sum2 = 0;
    for (i = 0; i < 2 * frameWithoutChecksum.length; i++) {
        isLeftHalfOfByte = i % 2 === 0;
        byteNumber = i >>> 1;
        byte = frameWithoutChecksum[byteNumber];
        halfOfByte = isLeftHalfOfByte
            ? (byte & 0xF0) >>> 4
            : byte & 0x0F;
        sum1 = (sum1 + halfOfByte) % 0x0F;
        sum2 = (sum2 + sum1) % 0x0F;
    }

    return (sum2 << 4) | sum1;
};

DataLinkLayer.$$isFunction = function (variable) {
    return typeof variable === 'function';
};
