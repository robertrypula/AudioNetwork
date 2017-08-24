// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';


var DataLinkLayerBuilder = function () {
    this._rxSymbolListener = undefined;
    this._rxSampleListener = undefined;
    this._rxSyncListener = undefined;
    this._rxConfigListener = undefined;
    this._configListener = undefined;
    this._txListener = undefined;
    this._txConfigListener = undefined;
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
    this.$$physicalLayer = (new PhysicalLayerBuilder())
        .rxSymbolListener(this.$$rxSymbolListener.bind(this))
        .rxSampleListener(this.$$rxSampleListener.bind(this))
        .rxSyncListener(this.$$rxSyncListener.bind(this))
        .rxConfigListener(this.$$rxConfigListener.bind(this))
        .configListener(this.$$configListener.bind(this))
        .txListener(this.$$txListener.bind(this))
        .txConfigListener(this.$$txConfigListener.bind(this))
        .build();

    // setup listeners
    this.$$rxSymbolListener = DataLinkLayer.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
    this.$$rxSampleListener = DataLinkLayer.$$isFunction(builder._rxSampleListener) ? builder._rxSampleListener : null;
    this.$$rxSyncListener = DataLinkLayer.$$isFunction(builder._rxSyncListener) ? builder._rxSyncListener : null;
    this.$$rxConfigListener = DataLinkLayer.$$isFunction(builder._rxConfigListener) ? builder._rxConfigListener : null;
    this.$$configListener = DataLinkLayer.$$isFunction(builder._configListener) ? builder._configListener : null;
    this.$$txListener = DataLinkLayer.$$isFunction(builder._txListener) ? builder._txListener : null;
    this.$$txConfigListener = DataLinkLayer.$$isFunction(builder._txConfigListener) ? builder._txConfigListener : null;
};

DataLinkLayer.prototype.$$rxSymbolListener = function (data) {
    this.$$rxSymbolListener ? this.$$rxSymbolListener(data) : undefined;
};

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

DataLinkLayer.$$isFunction = function (variable) {
    return typeof variable === 'function';
};

DataLinkLayer.$$getValueOrDefault = function (value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
};

DataLinkLayer.prototype.$$computeChecksum = function (data) {
    var
        sum1 = 0,
        sum2 = 0,
        i,
        value;

    // console.log(data.length);

    for (i = 0; i < 2 * data.length; i++) {
        value = i % 2 === 0
            ? (data[i >>> 1] >>> 4) & 0xF
            : data[i >>> 1] & 0xF;

        // console.log(i, value.toString(16));

        sum1 = (sum1 + value) % 15;
        sum2 = (sum2 + sum1) % 15;
    }

    // console.log(sum2.toString(16), sum1.toString(16));

    return (sum2 << 4) | sum1;
};
*/