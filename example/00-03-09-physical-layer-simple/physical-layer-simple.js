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
        .rxSampleDspDetailsListener(rxSampleDspDetailsListener)
        .rxDspConfigListener(rxDspConfigListener)
        .dspConfigListener(dspConfigListener)
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
    rxByteHistory.push(byteText);
    if (rxByteHistory.length > RX_HISTORY_SIZE) {
        rxByteHistory.shift();
    }

    html('#rx-byte-history', rxByteHistory.join(' '));
    html('#rx-symbol', state.symbol ? state.symbol : 'idle');
    html('#rx-byte', byteText);
    setActive('#rx-byte-container', '#rx-symbol-' + (state.symbol ? state.symbol : ''));
}

function rxSampleDspDetailsListener(state) {
    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');
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
}

function dspConfigListener(state) {
    html('#loopback', state.isLoopbackEnabled ? 'enabled' : 'disabled');
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

function onSetTxSampleRateClick(txSampleRate) {
    physicalLayer.setTxSampleRate(txSampleRate);
}

function onTxSyncClick() {
    physicalLayer.txSync();
}
