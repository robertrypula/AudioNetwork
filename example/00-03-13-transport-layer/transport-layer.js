// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    ASCII_NULL = 0,
    UNICODE_UNKNOWN = '�',
    transportLayerBuilder,
    transportLayer;

function init() {
    transportLayerBuilder = new TransportLayerBuilder();
    transportLayer = transportLayerBuilder
        .build();
}

function rxSampleListener(state) {
    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');
}

function configListener(state) {
    setActive(
        '#loopback-container',
        '#loopback-' + (state.isLoopbackEnabled ? 'enabled' : 'disabled')
    );
}

function txConfigListener(state) {
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.sampleRate);
}

function rxConfigListener(state) {
    html('#rx-sample-rate', (state.sampleRate / 1000).toFixed(1));
}

// ---------

function onSendTwoWaySyncClick() {
    transportLayer.txTwoWaySync();
}

function onTxSampleRateClick(txSampleRate) {
    transportLayer.setTxSampleRate(txSampleRate);
}

function onLoopbackClick(state) {
    transportLayer.setLoopback(state);
}

function onSendHexClick() {
    var
        textSplit = getFormFieldValue('#tx-hex', 'split'),
        payload = [],
        byte,
        i;

    for (i = 0; i < textSplit.length; i++) {
        byte = parseInt(textSplit[i], 16);
        if (0 <= byte && byte <= 255) {
            payload.push(byte);
        }
    }
    txByteBlock(payload);
}

function onSendAsciiClick() {
    var
        text = getFormFieldValue('#tx-ascii'),
        payload = [],
        byte,
        i;

    for (i = 0; i < text.length; i++) {
        byte = isPrintableAscii(text[i])
            ? text.charCodeAt(i)
            : ASCII_NULL;
        payload.push(byte);
    }
    txByteBlock(payload);
}

function txByteBlock(payload) {
    try {
        // transportLayer.
    } catch (e) {
        alert(e);
    }
}

// ---------

function isPrintableAscii(char) {
    return char >= ' ' && char <= '~';
}

function getByteHexFromByte(byte) {
    var byteHex = byte.toString(16);

    return pad(byteHex, 2)
}

function getByteHexFromByteList(byteList) {
    var i, byte, result = [];

    for (i = 0; i < byteList.length; i++) {
        byte = byteList[i];
        result.push(
            getByteHexFromByte(byte)
        );
    }

    return result.join(' ');
}

function getByteHexFromSymbol(symbol, symbolMin) {
    var
        byte = symbol - symbolMin,
        byteHex = byte.toString(16);

    if (symbol === 0) {
        return '[gap]';
    }

    if (byte > 255) {
        // two symbols at the end of the range are 'sync' symbols
        return '[sync' + (byte === 256 ? 'A' : 'B') + ']';
    }

    return pad(byteHex, 2)
}

function getByteHexFromSymbolList(symbolList, symbolMin) {
    var i, symbol, result = [];

    for (i = 0; i < symbolList.length; i++) {
        symbol = symbolList[i];
        result.push(
            getByteHexFromSymbol(symbol, symbolMin)
        );
    }

    return result.join(' ');
}

function pad(num, size) {
    var s = '000000000' + num;

    return s.substr(s.length - size);
}

function getAsciiFromByteList(byteList) {
    var i, char, result = '';

    for (i = 0; i < byteList.length; i++) {
        char = String.fromCharCode(byteList[i]);
        result += isPrintableAscii(char) ? char : UNICODE_UNKNOWN;
    }

    return result;
}
