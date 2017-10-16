// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_BYTE_HEX_HISTORY_SIZE = 8,
    rxByteHexContainerRendered = false,
    rxByteHexHistory = [],
    physicalLayerBuilder,
    physicalLayer;

function init() {
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .rxSymbolListener(rxSymbolListener)
        .rxSyncStatusListener(rxSyncStatusListener)
        .rxDspConfigListener(rxDspConfigListener)
        .dspConfigListener(dspConfigListener)
        .txDspConfigListener(txDspConfigListener)
        .build();
}

function rxSymbolListener(state) {
    var
        rxDspConfig = physicalLayer.getRxDspConfig(),
        rxByteHex,
        rxByte;

    rxByte = state.rxSymbol
        ? state.rxSymbol - rxDspConfig.rxSymbolMin
        : null;
    rxByteHex = rxByte !== null ? byteToHex(rxByte) : '---';
    rxByteHexHistory.push(rxByteHex);
    if (rxByteHexHistory.length > RX_BYTE_HEX_HISTORY_SIZE) {
        rxByteHexHistory.shift();
    }

    html('#rx-byte-hex-history', rxByteHexHistory.join(' '));
    html('#rx-byte-hex', rxByteHex);
    setActive(
        '#rx-byte-hex-container',
        '#rx-symbol-' + (state.rxSymbol ? state.rxSymbol : '')
    );
}

function rxSyncStatusListener(state) {
    html(
        '#rx-sync-status',
        (state.isRxSyncOk ? 'OK' : 'waiting for sync...') +
        (state.isRxSyncInProgress ? ' [sync in progress]' : '')
    );
}

function rxDspConfigListener(state) {
    var rxSymbol, htmlContent, rxByte;

    if (!rxByteHexContainerRendered) {
        htmlContent = '';
        for (rxSymbol = state.rxSymbolMin; rxSymbol <= state.rxSymbolMax; rxSymbol++) {
            rxByte = rxSymbol - state.rxSymbolMin;
            htmlContent +=
                '<span id="rx-symbol-' + rxSymbol + '">' +
                byteToHex(rxByte) +
                '</span>';
        }
        html('#rx-byte-hex-container', htmlContent);
        rxByteHexContainerRendered = true;
    }
    html('#rx-sample-rate', (state.rxSampleRate / 1000).toFixed(1));
}

function dspConfigListener(state) {
    html('#loopback', state.isLoopbackEnabled ? 'enabled' : 'disabled');
}

function txDspConfigListener(state) {
    var txSymbol, txByte, htmlContent = '';

    for (txSymbol = state.txSymbolMin; txSymbol <= state.txSymbolMax; txSymbol++) {
        txByte = txSymbol - state.txSymbolMin;
        htmlContent +=
            '<a href="javascript:void(0)" onClick="onTxByteClick(' + txByte + ')">' +
            byteToHex(txByte) +
            '</a>';
    }
    html('#tx-byte-hex-container', htmlContent);
    html('#tx-sample-rate', (state.txSampleRate / 1000).toFixed(1));
}

function onTxByteClick(txByte) {
    var
        txDspConfig = physicalLayer.getTxDspConfig(),
        txSymbol = txDspConfig.txSymbolMin + txByte;

    try {
        physicalLayer.txSymbol(txSymbol);
    } catch (e) {
        alert(e); // it's because user may enter symbol out of range
    }
}

function onSetLoopbackClick(state) {
    physicalLayer.setLoopback(state);
}

function onSetTxSampleRateClick(txSampleRate) {
    physicalLayer.setTxSampleRate(txSampleRate);
}

function onTxSyncClick() {
    physicalLayer.txSync();
}
