// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_HISTORY_SIZE = 8,
    rxByteContainerRendered = false,
    physicalLayerBuilder,
    rxByteHistory = [],
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
    rxByteHistory.push(byteText);
    if (rxByteHistory.length > RX_HISTORY_SIZE) {
        rxByteHistory.shift();
    }

    html('#rx-byte-history', rxByteHistory.join(' '));
    html('#rx-symbol', state.symbol ? state.symbol : 'idle');
    html('#rx-byte', byteText);
    setActive('#rx-byte-container', '#rx-symbol-' + (state.symbol ? state.symbol : ''));
}

function rxSampleListener(state) {
    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');
}

function rxConfigListener(state) {
    var symbol, htmlContent, byte;

    if (!rxByteContainerRendered) {
        htmlContent = '';
        for (symbol = state.symbolMin; symbol <= state.symbolMax; symbol++) {
            byte = symbol - state.symbolMin;
            htmlContent +=
                '<span id="rx-symbol-' + symbol + '">' +
                byteToText(byte) +
                '</span>';
        }
        html('#rx-byte-container', htmlContent);
        rxByteContainerRendered = true;
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
    html('#tx-byte-container', htmlContent);
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
