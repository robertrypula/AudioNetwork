// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    ASCII_NULL = 0,
    UNICODE_UNKNOWN = '�',
    RAW_SYMBOL_MAX = 10,
    dataLinkLayerBuilder,
    dataLinkLayer,
    rawSymbolBuffer = new Buffer(RAW_SYMBOL_MAX);

function init() {
    dataLinkLayerBuilder = new DataLinkLayerBuilder();
    dataLinkLayer = dataLinkLayerBuilder
        .txListener(txListener)
        .rxSampleListener(rxSampleListener)
        .configListener(configListener)
        .txConfigListener(txConfigListener)
        .rxConfigListener(rxConfigListener)
        .build();
}

function txListener(state) {
    var
        txConfig = dataLinkLayer.getPhysicalLayer().getTxConfig(),
        symbolMin = txConfig.symbolMin,
        txCurrent = state.symbol
            ? getHexFromSymbol(state.symbol, symbolMin)
            : 'idle',
        txQueue = getHexFromList(state.symbolQueue, symbolMin);

    html('#tx-hex-current', txCurrent);
    html('#tx-hex-queue', txQueue);
}

function rxSampleListener(state) {
    var
        rxConfig = dataLinkLayer.getPhysicalLayer().getRxConfig(),
        symbolMin = rxConfig.symbolMin;

    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');

    if (state.isSymbolSamplingPoint) {
        rawSymbolBuffer.pushEvenIfFull(state.symbolRaw);
        html('#rx-raw-data', getHexFromList(rawSymbolBuffer.getAll(), symbolMin));
    }
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

function onTxSampleRateClick(txSampleRate) {
    dataLinkLayer.setTxSampleRate(txSampleRate);
}

function onLoopbackClick(state) {
    dataLinkLayer.setLoopback(state);
}

function onSendSyncClick() {
    dataLinkLayer.sendSync();
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
    sendFrame(payload);
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
    sendFrame(payload);
}

function sendFrame(payload) {
    try {
        dataLinkLayer.sendFrame(payload);
    } catch (e) {
        alert(e);
    }
}

// ---------

function isPrintableAscii(char) {
    return char >= ' ' && char <= '~';
}

function getHexFromSymbol(symbol, symbolMin) {
    var
        byte = symbol - symbolMin,
        byteHex = byte.toString(16);

    if (byte > 255) {
        // two symbols at the end of the range are 'sync' symbols
        return '[' + pad(byteHex, 3) + ' sync]';
    }

    return pad(byteHex, 2)
}

function getHexFromList(symbolList, symbolMin) {
    var i, symbol, result = [];

    for (i = 0; i < symbolList.length; i++) {
        symbol = symbolList[i];
        result.push(
            getHexFromSymbol(symbol, symbolMin)
        );
    }

    return result.join(' ');
}

function pad(num, size) {
    var s = '000000000' + num;

    return s.substr(s.length - size);
}
