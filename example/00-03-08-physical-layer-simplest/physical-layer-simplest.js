// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    physicalLayerBuilder,
    physicalLayer;

function init() {
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .rxSymbolListener(rxSymbolListener)
        .rxSampleDspDetailsListener(rxSampleDspDetailsListener)
        .build();
    html('#rx-sample-rate', physicalLayer.getRxDspConfig().rxSampleRate);
}

function onSetTxSampleRateClick() {
    var txSampleRate = getFormFieldValue('#tx-sample-rate', 'int');

    physicalLayer.setTxSampleRate(txSampleRate);
    alert('Tx Sample Rate set!');
}

function onTxSyncClick() {
    physicalLayer.txSync();
}

function onSendByteClick() {
    var
        byte = getFormFieldValue('#tx-byte', 'int'),
        txDspConfig = physicalLayer.getTxDspConfig(),
        txSymbol = txDspConfig.txSymbolMin + byte;

    try {
        physicalLayer.txSymbol(txSymbol);
    } catch (e) {
        alert(e); // it's because user may enter symbol out of range
    }
}

function rxSymbolListener(state) {
    var rxDspConfig, byte;

    rxDspConfig = physicalLayer.getRxDspConfig();
    byte = state.rxSymbol
        ? state.rxSymbol - rxDspConfig.rxSymbolMin
        : null;
    html('#rx-symbol', state.rxSymbol ? state.rxSymbol : 'idle');
    html('#rx-byte', byte !== null ? byte : '---');
}

function rxSampleDspDetailsListener(data) {
    html('#sync', data.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', data.isSyncInProgress ? '[sync in progress]' : '');
}
