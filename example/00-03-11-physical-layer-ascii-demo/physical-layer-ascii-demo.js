// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    physicalLayerBuilder,
    physicalLayer,
    ioTraffic;

function init() {
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .rxSyncStatusListener(rxSyncStatusListener)
        .rxDspConfigListener(rxDspConfigListener)
        .txDspConfigListener(txDspConfigListener)
        .dspConfigListener(dspConfigListener)
        .rxSymbolListener(rxSymbolListener)
        .txSymbolListener(txSymbolListener)
        .build();

    ioTraffic = new IoTraffic(document.getElementById('io-traffic'));
    invokeOnEnter('#tx-textarea', onTxTextClick);
}

// ----------------------------------

function dspConfigListener(state) {
    setActive(
        '#loopback-container',
        '#loopback-' + (state.isLoopbackEnabled ? 'enabled' : 'disabled')
    );
}

function rxDspConfigListener(state) {
    html('#rx-sample-rate', (state.rxSampleRate / 1000).toFixed(1));
}

function rxSyncStatusListener(state) {
    html(
        '#rx-sync-status',
        (state.isRxSyncOk ? 'OK' : 'waiting for sync...') +
        (state.isRxSyncInProgress ? ' [sync in progress]' : '')
    );
}

function txDspConfigListener(state) {
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.txSampleRate);
}

function txSymbolListener(state) {
    ioTraffic.addClass('tx-' + state.id, 'finished');
    ioTraffic.updateProgressBar('tx-' + state.id, 1, IoTraffic.PROGRESS_BAR_A);
}

function rxSymbolListener(state) {
    var
        rxDspConfig = physicalLayer.getRxDspConfig(),
        rxByte,
        rxChar;

    if (state.rxSymbol === null) {
        return;
    }

    rxByte = state.rxSymbol - rxDspConfig.rxSymbolMin;
    rxChar = getAsciiFromByte(rxByte);
    ioTraffic.addRxItem('rx-' + state.id, rxChar);
    ioTraffic.addClass('rx-' + state.id, 'finished');
    ioTraffic.updateProgressBar('rx-' + state.id, 1, IoTraffic.PROGRESS_BAR_A);
}

// ----------------------------------

function onSetLoopbackClick(state) {
    physicalLayer.setLoopback(state);
}

function onSetTxSampleRateClick(txSampleRate) {
    physicalLayer.setTxSampleRate(txSampleRate);
}

function onTxSyncClick() {
    physicalLayer.txSync();
}

function onTxTextClick() {
    var
        text = getFormFieldValue('#tx-textarea'),
        byteList = getByteListFromAsciiString(text),
        txDspConfig = physicalLayer.getTxDspConfig(),
        txSymbolMin = txDspConfig.txSymbolMin,
        txSymbolId,
        txSymbol,
        txByte,
        txChar,
        i;

    for (i = 0; i < byteList.length; i++) {
        txByte = byteList[i];
        txChar = getAsciiFromByte(txByte);
        txSymbol = txSymbolMin + txByte;
        txSymbolId = physicalLayer.txSymbol(txSymbol);
        txChar = txChar === ' ' ? '&nbsp;' : txChar;
        ioTraffic.addTxItem('tx-' + txSymbolId, txChar);
    }
    setValue('#tx-textarea', '');
    ioTraffic.forceNewRow();
}
