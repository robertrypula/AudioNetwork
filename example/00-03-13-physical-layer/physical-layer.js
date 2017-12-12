// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayerBuilder = AudioNetwork.Rewrite.PhysicalLayer.PhysicalLayerBuilder;

var
    physicalLayerBuilder,
    physicalLayer,
    ioTraffic,
    txSymbolLastRenderedId = 0;

function init() {
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .rxSyncStatusListener(rxSyncStatusListener)
        .rxDspConfigListener(rxDspConfigListener)
        .txDspConfigListener(txDspConfigListener)
        .dspConfigListener(dspConfigListener)
        .rxSymbolListener(rxSymbolListener)
        .txSymbolProgressListener(txSymbolProgressListener)
        .build();

    ioTraffic = new IoTraffic(document.getElementById('io-traffic'));
    invokeOnEnter('#tx-textarea', onTxClick);
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

function txSymbolProgressListener(data) {
    var
        txSymbolNotYetRendered,
        txSymbolQueueItem,
        id,
        i;

    for (i = 0; i < data.txSymbolQueue.length; i++) {
        txSymbolQueueItem = data.txSymbolQueue[i];
        if (txSymbolQueueItem.txSymbolType !== 'TX_SYMBOL_FSK') {        // TODO filter 'Sync'
            continue;
        }

        id = txSymbolQueueItem.id;
        txSymbolNotYetRendered = id > txSymbolLastRenderedId;
        if (txSymbolNotYetRendered) {
            ioTraffic.addTxItem('tx-' + id, getTxSymbolHtml(txSymbolQueueItem));
            txSymbolLastRenderedId = id;
        }
    }

    ioTraffic.updateProgressBar('tx-' + data.txSymbolCurrent.id, 1);
    ioTraffic.addClass('tx-' + data.txSymbol.id, 'io-traffic-success');
}

function getTxSymbolHtml(txSymbolQueueItem) {
    var txSymbolMin, txSymbol, txByte, txChar;

    txSymbolMin = physicalLayer.getTxDspConfig().txSymbolMin;
    txSymbol = txSymbolQueueItem.txFskSymbol;
    txByte = txSymbol - txSymbolMin;
    txChar = getAsciiFromByte(txByte);

    return txChar === ' ' ? '&nbsp;' : txChar;
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
    ioTraffic.addClass('rx-' + state.id, 'io-traffic-success');
    ioTraffic.updateProgressBar('rx-' + state.id, 1);
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

function onTxClick() {
    var
        text = getFormFieldValue('#tx-textarea'),
        byteList = getByteListFromAsciiString(text),
        txDspConfig = physicalLayer.getTxDspConfig(),
        txSymbolMin = txDspConfig.txSymbolMin,
        txSymbol,
        txByte,
        txChar,
        i;

    for (i = 0; i < byteList.length; i++) {
        txByte = byteList[i];
        txChar = getAsciiFromByte(txByte);
        txSymbol = txSymbolMin + txByte;
        physicalLayer.txSymbol(txSymbol);
    }
    setValue('#tx-textarea', '');
    ioTraffic.forceNewRow();         // TODO probably not needed??
}
