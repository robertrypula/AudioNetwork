// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    physicalLayerBuilder,
    physicalLayer;

function init() {
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .rxSymbolListener(rxSymbolListener)
        .rxSampleListener(rxSampleListener)
        .build();
    html('#rx-sample-rate', physicalLayer.getRxConfig().sampleRate);
}

function onSetTxSampleRateClick() {
    var txSampleRate = getFormFieldValue('#tx-sample-rate', 'int');

    physicalLayer.setTxSampleRate(txSampleRate);
    alert('Tx Sample Rate set!');
}

function onSendSyncClick() {
    physicalLayer.sendSync();
}

function onSendByteClick() {
    var
        byte = getFormFieldValue('#tx-byte', 'int'),
        txConfig = physicalLayer.getTxConfig(),
        symbol = txConfig.symbolMin + byte;

    try {
        physicalLayer.sendSymbol(symbol);
    } catch (e) {
        alert(e); // it's because user may enter symbol out of range
    }
}

function rxSymbolListener(state) {
    var rxConfig, byte;

    rxConfig = physicalLayer.getRxConfig();
    byte = state.symbol !== null
        ? state.symbol - rxConfig.symbolMin
        : null;
    html('#rx-symbol', state.symbol !== null ? state.symbol : 'idle');
    html('#rx-byte', byte !== null ? byte : '---');
}

function rxSampleListener(data) {
    html('#sync', data.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', data.isSyncInProgress ? '[sync in progress]' : '');
}
