// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayerBuilder = AudioNetwork.Rewrite.PhysicalLayer.PhysicalLayerBuilder;

var
    PROGRESS_BAR_FULL = 1,
    MAX_VALUE_IN_BYTE = 255,
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

function getTxByteFromTxFskSymbol(txFskSymbol) {
    return txFskSymbol - physicalLayer.getTxDspConfig().txSymbolMin;
}

function getTxFskSymbolFromTxByte(txByte) {
    return physicalLayer.getTxDspConfig().txSymbolMin + txByte;
}

function getRxByteFromRxFskSymbol(rxSymbol) {
    return rxSymbol - physicalLayer.getRxDspConfig().rxSymbolMin;
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
        (state.isRxSyncOk ? 'OK' : 'waiting...') +
        (state.isRxSyncInProgress ? ' [sync]' : '')
    );
}

function txDspConfigListener(state) {
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.txSampleRate);
}

// ----------------------------------

function txSymbolProgressListener(data) {
    var
        txSymbolNotYetRendered,
        txSymbolQueueItem,
        isSpecialSymbol,
        id,
        i;

    for (i = 0; i < data.txSymbolQueue.length; i++) {
        txSymbolQueueItem = data.txSymbolQueue[i];
        isSpecialSymbol =
            txSymbolQueueItem.txSymbolType !== 'TX_SYMBOL_FSK' ||
            getTxByteFromTxFskSymbol(txSymbolQueueItem.txFskSymbol) > MAX_VALUE_IN_BYTE;

        if (isSpecialSymbol) {
            continue;
        }

        id = txSymbolQueueItem.id;
        txSymbolNotYetRendered = id > txSymbolLastRenderedId;
        if (txSymbolNotYetRendered) {
            ioTraffic.addTxItem('tx-' + id, getTxSymbolHtml(txSymbolQueueItem));
            txSymbolLastRenderedId = id;
        }
    }

    ioTraffic.updateProgressBar('tx-' + data.txSymbolCurrent.id, PROGRESS_BAR_FULL);
    ioTraffic.addClass('tx-' + data.txSymbol.id, 'io-traffic-success');
}

function getTxSymbolHtml(txSymbolQueueItem) {
    var txByte, txChar;

    txByte = getTxByteFromTxFskSymbol(txSymbolQueueItem.txFskSymbol);
    txChar = getAsciiFromByte(txByte);

    return txChar === ' ' ? '&nbsp;' : txChar;
}

function rxSymbolListener(state) {
    var rxByte, rxChar;

    if (state.rxSymbol === null) {
        return;
    }

    rxByte = getRxByteFromRxFskSymbol(state.rxSymbol);
    rxChar = getAsciiFromByte(rxByte);
    ioTraffic.addRxItem('rx-' + state.id, rxChar);
    ioTraffic.addClass('rx-' + state.id, 'io-traffic-success');
    ioTraffic.updateProgressBar('rx-' + state.id, PROGRESS_BAR_FULL);
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
        txFskSymbol,
        txByte,
        i;

    for (i = 0; i < byteList.length; i++) {
        txByte = byteList[i];
        txFskSymbol = getTxFskSymbolFromTxByte(txByte);
        physicalLayer.txSymbol(txFskSymbol);
    }
    setValue('#tx-textarea', '');
    ioTraffic.forceNewRow();
}
