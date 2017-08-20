// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    BYTE_HISTORY_MAX = 8,
    receivedByteContainerRendered = false,
    physicalLayerBuilder,
    receivedBytes = [],
    physicalLayer;

function init() {
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .rxSymbolListener(rxSymbolListener)
        .rxSampleListener(rxSampleListener)
        .rxConfigListener(rxConfigListener)
        .configListener(configListener)
        .txConfigListener(txConfigListener)
        .build();
}

function rxSymbolListener(data) {
    var
        rxConfig = physicalLayer.getRxConfig(),
        byte,
        byteText;

    byte = data.symbol
        ? data.symbol - rxConfig.symbolMin
        : null;
    byteText = byte !== null ? byteToText(byte) : '---';
    receivedBytes.push(byteText);
    if (receivedBytes.length > BYTE_HISTORY_MAX) {
        receivedBytes.shift();
    }

    html('#received-byte-history', receivedBytes.join(' '));
    html('#rx-symbol', data.symbol ? data.symbol : 'idle');
    html('#rx-byte', byteText);
    setActive('#received-byte-container', '#rx-symbol-' + (data.symbol ? data.symbol : ''));
}

function rxSampleListener(data) {
    html('#sync', data.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', data.isSyncInProgress ? '[sync in progress]' : '');
}

function rxConfigListener(data) {
    var symbol, htmlContent, byte;

    if (!receivedByteContainerRendered) {
        htmlContent = '';
        for (symbol = data.symbolMin; symbol <= data.symbolMax; symbol++) {
            byte = symbol - data.symbolMin;
            htmlContent +=
                '<span id="rx-symbol-' + symbol + '">' +
                byteToText(byte) +
                '</span>';
        }
        html('#received-byte-container', htmlContent);
        receivedByteContainerRendered = true;
    }
    html('#rx-sample-rate', (data.sampleRate / 1000).toFixed(1));
}

function configListener(data) {
    html('#loopback', data.isLoopbackEnabled ? 'enabled' : 'disabled');
}

function txConfigListener(data) {
    var symbol, byte, htmlContent = '';

    for (symbol = data.symbolMin; symbol <= data.symbolMax; symbol++) {
        byte = symbol - data.symbolMin;
        htmlContent +=
            '<a href="javascript:void(0)" onClick="onSendByteClick(' + byte + ')">' +
            byteToText(byte) +
            '</a>';
    }
    html('#send-byte-button-container', htmlContent);
    html('#tx-sample-rate', (data.sampleRate / 1000).toFixed(1));
}

function byteToText(byte) {
    return (byte < 16 ? '0' : '') + byte.toString(16).toUpperCase();
}

function onSendByteClick(byte) {
    var
        txConfig = physicalLayer.getTxConfig(),
        symbol = txConfig.symbolMin + byte;

    physicalLayer.sendSymbol(symbol);
}

function onSetTxSampleRateClick(txSampleRate) {
    physicalLayer.setTxSampleRate(txSampleRate);
}

function onSendSyncClick() {
    physicalLayer.sendSync();
}