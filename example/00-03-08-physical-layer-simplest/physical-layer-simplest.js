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
    var txSampleRate = getInputValue('#tx-sample-rate', 'int');

    physicalLayer.setTxSampleRate(txSampleRate);
    alert('Tx Sample Rate set!');
}

function onSendSyncClick() {
    physicalLayer.sendSync();
}

function onSendByteClick() {
    var
        byte = getInputValue('#tx-byte', 'int'),
        txConfig = physicalLayer.getTxConfig(),
        symbol = txConfig.symbolMin + byte;
    physicalLayer.sendSymbol(symbol);
}

function rxSymbolListener(data) {
    var rxConfig, byte;

    rxConfig = physicalLayer.getRxConfig();
    byte = data.symbol !== null
        ? data.symbol - rxConfig.symbolMin
        : null;
    html('#rx-symbol', data.symbol !== null ? data.symbol : 'idle');
    html('#rx-byte', byte !== null ? byte : '---');
}

function rxSampleListener(data) {
    html('#sync', data.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', data.isSyncInProgress ? '[sync in progress]' : '');
}
