// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_HISTORY_SIZE = 8,
    rxByteContainerRendered = false,
    physicalLayerBuilder,
    rxByteHistory = new Buffer(RX_HISTORY_SIZE),
    physicalLayer;

function init() {
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .rxSymbolListener(rxSymbolListener)
        .rxSampleListener(rxSampleListener)
        .rxSyncListener(rxSyncListener)
        .rxConfigListener(rxConfigListener)
        .configListener(configListener)
        .txListener(txListener)
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
    rxByteHistory.pushEvenIfFull(byteText);

    html('#rx-byte-history', rxByteHistory.getAll().join(' '));
    html('#rx-symbol', state.symbol ? state.symbol : 'idle');
    html('#rx-byte', byteText);
    setActive('#rx-byte-container', '#rx-symbol-' + (state.symbol ? state.symbol : ''));
    log('log-rx-symbol', state);
}

function rxSampleListener(state) {
    state.frequencyData = '[spectrogram array]';
    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');
    log('log-rx-sample', state);
}

function rxSyncListener(state) {
    log('log-rx-sync', state);
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
    log('log-rx-config', state);
}

function configListener(state) {
    html('#loopback', state.isLoopbackEnabled ? 'enabled' : 'disabled');
    log('log-config', state);
}

function txListener(state) {
    log('log-tx', state);
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
    html('#amplitude', (state.amplitude * 100).toFixed(0));
    log('log-tx-config', state);
}

function log(elementId, object) {
    html('#' + elementId, JSON.stringify(object, null, 2));
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
