// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    PhysicalLayerBuilder = AudioNetwork.Rewrite.PhysicalLayer.PhysicalLayerBuilder,
    physicalLayerBuilder,
    physicalLayer;

function init() {
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .rxSymbolListener(rxSymbolListener)
        .rxSyncStatusListener(rxSyncStatusListener)
        .build();
    html('#rx-sample-rate', physicalLayer.getRxSampleRate());
}

function onSetLoopbackClick(state) {
    physicalLayer.setLoopback(state);
    alert('Loopback state changed!');
}

function onSetTxSampleRateClick() {
    var txSampleRate = getFormFieldValue('#tx-sample-rate', 'int');

    physicalLayer.setTxSampleRate(txSampleRate);
    alert('Ok!');
}

function onTxSyncClick() {
    physicalLayer.txSync();
}

function onTxByteClick() {
    var
        txByte = getFormFieldValue('#tx-byte', 'int'),
        txDspConfig = physicalLayer.getTxDspConfig(),
        txSymbol = txDspConfig.txSymbolMin + txByte;

    try {
        physicalLayer.txSymbol(txSymbol);
    } catch (e) {
        alert(e); // it's because user may enter symbol out of range
    }
}

function rxSymbolListener(state) {
    var rxDspConfig, txByte;

    rxDspConfig = physicalLayer.getRxDspConfig();
    txByte = state.rxSymbol
        ? state.rxSymbol - rxDspConfig.rxSymbolMin
        : null;
    html('#rx-byte', txByte !== null ? txByte : '---');
}

function rxSyncStatusListener(state) {
    html(
        '#rx-sync-status',
        (state.isRxSyncOk ? 'OK' : 'waiting for sync...') +
        (state.isRxSyncInProgress ? ' [sync in progress]' : '')
    );
}
