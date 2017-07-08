// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var DataLinkLayer;

DataLinkLayer = function (stateHandler) {
    this.$$physicalLayer = new PhysicalLayer(this.$$physicalLayerStateHandler.bind(this));
    this.$$physicalLayerState = undefined;
    this.$$frameDataLimit = 7;
    this.$$byteBuffer = new Buffer(this.$$frameDataLimit + 2);
    this.$$stateHandler = DataLinkLayer.$$isFunction(stateHandler) ? stateHandler : null;
    this.$$frameCandidates = [];
    
    /*
    {
        isPacketReadyToTake:
        packet: {
            data: [],

        },
        packetCandidates: [
            {
                data: [32, 245, 243],
                checksumValid
            }
        ]
    }
    */
};

DataLinkLayer.prototype.setLoopback = function (state) {
    this.$$physicalLayer.setLoopback(state);
};

DataLinkLayer.prototype.send = function (data) {
    var i, byte, symbol, frame;

    if (data.length > this.$$frameDataLimit) {
        throw 'Frame cannot have more than ' + this.$$frameDataLimit + ' bytes';
    }

    frame = [];
    frame.push(0xF0 + data.length);
    for (i = 0; i < data.length; i++) {
        byte = data[i];
        frame.push(byte);
    }
    frame.push(computeChecksum(frame));

    for (i = 0; i < frame.length; i++) {
        byte = frame[i];
        symbol = physicalLayerState.band.symbolMin + byte;
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
        byteBuffer: this.$$byteBuffer.getAll()
    };

    return state;
};

DataLinkLayer.prototype.$$tryToFindValidFrame = function () {
    var i, byte, frame;

    /*
    0 - 00
    1 - 0x0
    2 - 0xx0
    3 - 0xxx0
    4 - 0xxxx0
    5 - 0xxxxx0
    6 - 0xxxxxx0
    7 - 0xxxxxxx0
    */

    for (i = 0; i < this.$$frameDataLimit; i++) {
        frame = [];

        frame.push(this.$$byteBuffer.getItem(i));

    }
};

DataLinkLayer.prototype.$$physicalLayerStateHandler = function (physicalLayerState) {
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

    console.log(data.length);

    for (i = 0; i < 2 * data.length; i++) {
        value = i % 2 === 0
            ? (data[i >>> 1] >>> 4) & 0xF
            : data[i >>> 1] & 0xF;

        console.log(i, value.toString(16));

        sum1 = (sum1 + value) % 15;
        sum2 = (sum2 + sum1) % 15;
    }

    console.log(sum2.toString(16), sum1.toString(16));

    return (sum2 << 4) | sum1;
};
