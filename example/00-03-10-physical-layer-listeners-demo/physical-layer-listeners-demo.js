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
        .rxSampleDspDetailsListener(rxSampleDspDetailsListener)
        .rxSyncListener(rxSyncListener)
        .rxDspConfigListener(rxDspConfigListener)
        .dspConfigListener(dspConfigListener)
        .txListener(txListener)
        .txDspConfigListener(txDspConfigListener)
        .build();
}

function rxSymbolListener(state) {
    var
        rxDspConfig = physicalLayer.getRxDspConfig(),
        byte,
        byteText;

    byte = state.symbol
        ? state.symbol - rxDspConfig.rxSymbolMin
        : null;
    byteText = byte !== null ? byteToText(byte) : '---';
    rxByteHistory.pushEvenIfFull(byteText);

    html('#rx-byte-history', rxByteHistory.getAll().join(' '));
    html('#rx-symbol', state.symbol ? state.symbol : 'idle');
    html('#rx-byte', byteText);
    setActive('#rx-byte-container', '#rx-symbol-' + (state.symbol ? state.symbol : ''));
    log('log-rx-symbol', state);
}

function rxSampleDspDetailsListener(state) {
    state.frequencyData = '[spectrogram array]';
    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');
    log('log-rx-sample', state);
}

function rxSyncListener(state) {
    log('log-rx-sync', state);
}

function rxDspConfigListener(state) {
    var symbol, htmlContent, byte;

    if (!rxByteContainerRendered) {
        htmlContent = '';
        for (symbol = state.rxSymbolMin; symbol <= state.rxSymbolMax; symbol++) {
            byte = symbol - state.rxSymbolMin;
            htmlContent +=
                '<span id="rx-symbol-' + symbol + '">' +
                byteToText(byte) +
                '</span>';
        }
        html('#rx-byte-container', htmlContent);
        rxByteContainerRendered = true;
    }
    html('#rx-sample-rate', (state.rxSampleRate / 1000).toFixed(1));
    log('log-rx-dsp-config', state);
}

function dspConfigListener(state) {
    html('#loopback', state.isLoopbackEnabled ? 'enabled' : 'disabled');
    log('log-dsp-config', state);
}

function txListener(state) {
    log('log-tx', state);
}

function txDspConfigListener(state) {
    var symbol, byte, htmlContent = '';

    for (symbol = state.txSymbolMin; symbol <= state.txSymbolMax; symbol++) {
        byte = symbol - state.txSymbolMin;
        htmlContent +=
            '<a href="javascript:void(0)" onClick="onSendByteClick(' + byte + ')">' +
            byteToText(byte) +
            '</a>';
    }
    html('#tx-byte-container', htmlContent);
    html('#tx-sample-rate', (state.txSampleRate / 1000).toFixed(1));
    html('#tx-amplitude', (state.txAmplitude * 100).toFixed(0));
    log('log-tx-dsp-config', state);
}

function log(elementId, object) {
    html('#' + elementId, JSON.stringify(object, null, 2));
}

function onSendByteClick(byte) {
    var
        txDspConfig = physicalLayer.getTxDspConfig(),
        txSymbol = txDspConfig.txSymbolMin + byte;

    try {
        physicalLayer.txSymbol(txSymbol);
    } catch (e) {
        alert(e); // it's because user may enter symbol out of range
    }
}
