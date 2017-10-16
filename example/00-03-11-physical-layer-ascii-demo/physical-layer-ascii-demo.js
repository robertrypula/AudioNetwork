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

var txId = 1;
var rxId = 1;

function onTxTextClick() {
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
        txChar = txChar === ' ' ? '&nbsp;' : txChar;
        ioTraffic.addTxItem('tx-' + txId, txChar);

        // TODO currently it's only emulation of transmission confirmation - implement it in physical layer
        (function (txId) {
            setTimeout(
                function () {
                    ioTraffic.addClass('tx-' + txId, 'finished');
                    ioTraffic.updateProgressBar('tx-' + txId, 1, IoTraffic.PROGRESS_BAR_A);
                },
                500 * (i + 1)
            );
        })(txId);

        txId++;
        /*
        ioTraffic.addClass(id, 'fade-out');
        ioTraffic.removeClass(id, 'fade-out');
        ioTraffic.updateProgress(id, 32);
        ioTraffic.updateItemHtml(id, 32);
        */
    }
    setValue('#tx-textarea', '');
    ioTraffic.forceNewRow();
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
    ioTraffic.addRxItem('rx-' + rxId, rxChar);
    ioTraffic.addClass('rx-' + rxId, 'finished');
    ioTraffic.updateProgressBar('rx-' + rxId, 1, IoTraffic.PROGRESS_BAR_A);

    rxId++;
}
