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

function rxSymbolListener(state) {
    var
        rxConfig = physicalLayer.getRxConfig(),
        byte,
        byteText;

    byte = state.symbol
        ? state.symbol - rxConfig.symbolMin
        : null;
    byteText = byte !== null ? byteToText(byte) : '---';
    receivedBytes.push(byteText);
    if (receivedBytes.length > BYTE_HISTORY_MAX) {
        receivedBytes.shift();
    }

    html('#received-byte-history', receivedBytes.join(' '));
    html('#rx-symbol', state.symbol ? state.symbol : 'idle');
    html('#rx-byte', byteText);
    setActive('#received-byte-container', '#rx-symbol-' + (state.symbol ? state.symbol : ''));
}

function rxSampleListener(state) {
    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');
}

function rxConfigListener(state) {
    var symbol, htmlContent, byte;

    if (!receivedByteContainerRendered) {
        htmlContent = '';
        for (symbol = state.symbolMin; symbol <= state.symbolMax; symbol++) {
            byte = symbol - state.symbolMin;
            htmlContent +=
                '<span id="rx-symbol-' + symbol + '">' +
                byteToText(byte) +
                '</span>';
        }
        html('#received-byte-container', htmlContent);
        receivedByteContainerRendered = true;
    }
    html('#rx-sample-rate', (state.sampleRate / 1000).toFixed(1));
}

function configListener(state) {
    html('#loopback', state.isLoopbackEnabled ? 'enabled' : 'disabled');
}

function txConfigListener(state) {
    var symbol, byte, htmlContent = '';

    for (symbol = state.symbolMin; symbol <= state.symbolMax; symbol++) {
        byte = symbol - state.symbolMin;
        htmlContent +=
            '<a href="javascript:void(0)" onClick="onSendByteClick(' + byte + ')">' +
            byteToText(byte) +
            '</a>';
    }
    html('#send-byte-button-container', htmlContent);
    html('#tx-sample-rate', (state.sampleRate / 1000).toFixed(1));
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