// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';


var DataLinkLayerBuilder = function () {
    this._framePayloadLengthMax = 7;

    this._frameListener = undefined;
    this._frameCandidateListener = undefined;

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
    this.$$frameLastId = undefined;
    this.$$frameCandidateList = [];

    // setup listeners - data link layer
    this.$$frameListener = DataLinkLayer.$$isFunction(builder._frameListener) ? builder._frameListener : null;
    this.$$frameCandidateListener = DataLinkLayer.$$isFunction(builder._frameCandidateListener) ? builder._frameCandidateListener : null;

    // setup listeners - physical layer
    this.$$rxSymbolListener = DataLinkLayer.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
    this.$$rxSampleListener = DataLinkLayer.$$isFunction(builder._rxSampleListener) ? builder._rxSampleListener : null;
    this.$$rxSyncListener = DataLinkLayer.$$isFunction(builder._rxSyncListener) ? builder._rxSyncListener : null;
    this.$$rxConfigListener = DataLinkLayer.$$isFunction(builder._rxConfigListener) ? builder._rxConfigListener : null;
    this.$$configListener = DataLinkLayer.$$isFunction(builder._configListener) ? builder._configListener : null;
    this.$$txListener = DataLinkLayer.$$isFunction(builder._txListener) ? builder._txListener : null;
    this.$$txConfigListener = DataLinkLayer.$$isFunction(builder._txConfigListener) ? builder._txConfigListener : null;
};

DataLinkLayer.PAYLOAD_TO_BIG_EXCEPTION = 'Payload is too big!';

DataLinkLayer.$$_HEADER_FRAME_START_MARKER = 0xE0;
DataLinkLayer.$$_HEADER_COMMAND_BIT_SET = 0x10;
DataLinkLayer.$$_HEADER_COMMAND_BIT_NOT_SET = 0x00;
DataLinkLayer.$$_HEADER_PAYLOAD_LENGTH_MASK = 0x0F;
DataLinkLayer.$$_HEADER_PAYLOAD_BYTE_MASK = 0xFF;

DataLinkLayer.$$_PAYLOAD_TYPE_COMMAND = 'PAYLOAD_TYPE_COMMAND';
DataLinkLayer.$$_PAYLOAD_TYPE_DATA = 'PAYLOAD_TYPE_DATA';

DataLinkLayer.prototype.getPhysicalLayer = function () {
    return this.$$physicalLayer;
};

DataLinkLayer.prototype.getRxSampleRate = function () {
    return this.$$physicalLayer.getRxSampleRate();  // alias for easier access
};

DataLinkLayer.prototype.setTxSampleRate = function (txSampleRate) {
    return this.$$physicalLayer.setTxSampleRate(txSampleRate);  // alias for easier access
};

DataLinkLayer.prototype.setAmplitude = function (amplitude) {
    return this.$$physicalLayer.setAmplitude(amplitude);  // alias for easier access
};

DataLinkLayer.prototype.sendSync = function () {
    return this.$$physicalLayer.sendSync();  // alias for easier access
};

DataLinkLayer.prototype.setLoopback = function (state) {
    return this.$$physicalLayer.setLoopback(state);  // alias for easier access
};

DataLinkLayer.prototype.sendFrame = function (payload) {
    var payloadType, frame, txConfig, symbolMin, i, byte, symbol;

    if (payload.length > this.$$framePayloadLengthMax) {
        throw DataLinkLayer.PAYLOAD_TO_BIG_EXCEPTION;
    }
    payloadType = DataLinkLayer.$$_PAYLOAD_TYPE_DATA;
    frame = DataLinkLayer.$$buildFrame(payloadType, payload);

    txConfig = this.$$physicalLayer.getTxConfig();
    symbolMin = txConfig.symbolMin;
    for (i = 0; i < frame.length; i++) {
        byte = frame[i];
        symbol = symbolMin + byte;
        this.$$physicalLayer.sendSymbol(symbol);
    }
};

DataLinkLayer.prototype.getFrame = function () {
    // TODO implement
    return {
        id: 0,
        header: 0xF5,
        payload: [0x61, 0x62, 0x63, 0x54, 0x34],
        checksum: 0x23,
        isCommand: false,
        frameCandidateId: 3
    };
};

DataLinkLayer.prototype.getFrameCandidate = function () {
    // TODO implement
    var tmp = {
        id: 4,
        received: [32, 32],
        expected: 8,
        isValid: false,
        symbolId: [3, 4]
    };

    return [tmp, tmp];
};

// -----------------------------------------------------

DataLinkLayer.prototype.$$rxSymbolListener = function (data) {
    var
        rxSample = this.$$physicalLayer.getRxSample(),
        symbolId = data.id;

    this.$$handleSymbolRaw(rxSample.symbolRaw, symbolId);
    this.$$rxSymbolListener ? this.$$rxSymbolListener(data) : undefined;
};

DataLinkLayer.prototype.$$handleSymbolRaw = function (symbolRaw, symbolId) {
    var isNewFrameAvailable = false;

    this.$$cleanUpFrameCandidateList();
    this.$$addSymbolRawToFrameCandidateList(symbolRaw, symbolId);
    this.$$tryToCreateNewFrameCandidate(symbolRaw, symbolId);
    this.$$tryToFindNewFrame();

    if (this.$$frame && this.$$frame.id !== this.$$frameLastId) {
        this.$$frameLastId = this.$$frame.id;
        isNewFrameAvailable = true;
    }

    // call listeners
    this.$$frameCandidateListener ? this.$$frameCandidateListener(this.getFrameCandidate()) : undefined;
    if (true || isNewFrameAvailable) {
        this.$$frameListener ? this.$$frameListener(this.getFrame()) : undefined;
    }
};

DataLinkLayer.prototype.$$cleanUpFrameCandidateList = function () {
    // TODO implement
};

DataLinkLayer.prototype.$$addSymbolRawToFrameCandidateList = function (symbolRaw, symbolId) {
    // TODO implement
};

DataLinkLayer.prototype.$$tryToCreateNewFrameCandidate = function (symbolRaw, symbolId) {
    // TODO implement
};

DataLinkLayer.prototype.$$tryToFindNewFrame = function () {
    // TODO implement
};

// -----------------------------------------------------

DataLinkLayer.prototype.$$rxSampleListener = function (data) {
    this.$$rxSampleListener ? this.$$rxSampleListener(data) : undefined;
};

DataLinkLayer.prototype.$$rxSyncListener = function (data) {
    this.$$rxSyncListener ? this.$$rxSyncListener(data) : undefined;
};

DataLinkLayer.prototype.$$rxConfigListener = function (data) {
    this.$$rxConfigListener ? this.$$rxConfigListener(data) : undefined;
};

DataLinkLayer.prototype.$$configListener = function (data) {
    this.$$configListener ? this.$$configListener(data) : undefined;
};

DataLinkLayer.prototype.$$txListener = function (data) {
    this.$$txListener ? this.$$txListener(data) : undefined;
};

DataLinkLayer.prototype.$$txConfigListener = function (data) {
    this.$$txConfigListener ? this.$$txConfigListener(data) : undefined;
};

// -----------------------------------------------------

DataLinkLayer.$$buildFrame = function (payloadType, payload) {
    var frame, isCommand, header, checksum, i, byte;

    frame = [];
    isCommand = payloadType === DataLinkLayer.$$_PAYLOAD_TYPE_COMMAND;
    header = DataLinkLayer.$$getHeader(isCommand, payload.length);
    frame.push(header);
    for (i = 0; i < payload.length; i++) {
        byte = payload[i] & DataLinkLayer.$$_HEADER_PAYLOAD_BYTE_MASK;
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

DataLinkLayer.$$computeChecksum = function (frameWithoutChecksum) {
    var sum1, sum2, i, isLeftHalfOfByte, byteNumber, byte, halfOfByte;

    sum1 = 0;
    sum2 = 0;
    for (i = 0; i < 2 * frameWithoutChecksum.length; i++) {
        isLeftHalfOfByte = i % 2 === 0;
        byteNumber = i >>> 1;
        byte = frameWithoutChecksum[byteNumber];
        halfOfByte = isLeftHalfOfByte
            ? ((byte & 0xF0) >>> 4)
            : byte & 0x0F;
        sum1 = (sum1 + halfOfByte) % 15;
        sum2 = (sum2 + sum1) % 15;
    }

    return (sum2 << 4) | sum1;
};

DataLinkLayer.$$isFunction = function (variable) {
    return typeof variable === 'function';
};


/*
var DataLinkLayer;

DataLinkLayer = function (stateHandler) {
    var physicalLayerBuilder = new DataLinkLayerBuilder();

    this.$$physicalLayer = physicalLayerBuilder
        .rxSymbolListener(this.$$rxSampleListener.bind(this))
        .build();
    this.$$physicalLayerState = undefined;
    this.$$dataLimit = 15;
    this.$$byteBuffer = new Buffer(this.$$dataLimit + 2);
    this.$$byteBuffer.fillWith(0);
    this.$$stateHandler = DataLinkLayer.$$isFunction(stateHandler) ? stateHandler : null;
    this.$$validFrameList = [];
};

DataLinkLayer.prototype.setLoopback = function (state) {
    this.$$physicalLayer.setLoopback(state);
};

DataLinkLayer.prototype.send = function (data) {
    var i, byte, symbol, frame;

    if (data.length > this.$$dataLimit) {
        throw 'Frame cannot have more than ' + this.$$dataLimit + ' bytes';
    }

    frame = [];
    frame.push(0xF0 + data.length);
    for (i = 0; i < data.length; i++) {
        byte = data[i];
        frame.push(byte);
    }
    frame.push(this.$$computeChecksum(frame));

    for (i = 0; i < frame.length; i++) {
        byte = frame[i];
        symbol = this.$$physicalLayerState.band.symbolMin + byte;
        this.$$physicalLayer.txSymbol(symbol);
    }
};

DataLinkLayer.prototype.connect = function (sampleRate) {
    this.$$physicalLayer.txConnect(sampleRate);
};

DataLinkLayer.prototype.getState = function () {
    var state;

    state = {
        physicalLayerState: this.$$physicalLayerState,
        byteBuffer: this.$$byteBuffer.getAll(),
        validFrameList: this.$$validFrameList,
        isFrameReadyToTake: this.$$physicalLayerState.isSymbolSamplingPoint
    };

    return state;
};

DataLinkLayer.prototype.$$tryToFindValidFrame = function () {
    var i, j, frame, byte, checksumPayload, frameList = [];

    this.$$validFrameList = [];
    for (i = 0; i <= this.$$dataLimit; i++) {
        checksumPayload = [];
        frame = {
            length: undefined,
            data: [],
            checksum: undefined,
            isValid: false
        };

        byte = this.$$byteBuffer.getItem(i);
        frame.length = byte;
        checksumPayload.push(byte);
        for (j = i + 1; j <= this.$$dataLimit; j++) {
            byte = this.$$byteBuffer.getItem(j);
            frame.data.push(byte);
            checksumPayload.push(byte);
        }
        byte = this.$$byteBuffer.getItem(this.$$dataLimit + 1);
        frame.checksum = byte;
        frame.checksumShouldBe = this.$$computeChecksum(checksumPayload);
        frame.lengthShouldBe = 0xF0 + (this.$$dataLimit - i);
        frame.isValid = frame.checksumShouldBe === frame.checksum &&
            frame.lengthShouldBe === frame.length;

        if (frame.isValid) {
            this.$$validFrameList.push(frame);
        }

        frameList.push(frame);
    }
};

DataLinkLayer.prototype.$$rxSampleListener = function (physicalLayerState) {

    return;
    var byte, state;

    this.$$physicalLayerState = physicalLayerState;

    if (physicalLayerState.isSymbolSamplingPoint) {
        byte = physicalLayerState.symbol - physicalLayerState.band.symbolMin;
        this.$$byteBuffer.pushEvenIfFull(byte);
        this.$$tryToFindValidFrame();
    }

    state = this.getState();

    if (this.$$stateHandler) {
        this.$$stateHandler(state);
    }
};

DataLinkLayer.$$getValueOrDefault = function (value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
};


*/