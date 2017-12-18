// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    PhysicalLayerBuilder = AudioNetwork.Rewrite.PhysicalLayer.PhysicalLayerBuilder,
    Buffer = AudioNetwork.Rewrite.Util.Buffer;

var
    RX_BYTE_HEX_HISTORY_SIZE = 8,
    rxByteHexContainerRendered = false,
    rxByteHexHistory = new Buffer(RX_BYTE_HEX_HISTORY_SIZE),
    physicalLayerBuilder,
    physicalLayer;

function init() {
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .rxSymbolListener(rxSymbolListener)
        .rxSyncStatusListener(rxSyncStatusListener)
        .rxSampleDspDetailsListener(rxSampleDspDetailsListener)
        .rxSyncDspDetailsListener(rxSyncDspDetailsListener)
        .rxDspConfigListener(rxDspConfigListener)
        .dspConfigListener(dspConfigListener)
        .txSymbolListener(txSymbolListener)
        .txSymbolProgressListener(txSymbolProgressListener)
        .txDspConfigListener(txDspConfigListener)
        .build();
}

function rxSymbolListener(state) {
    var
        rxDspConfig = physicalLayer.getRxDspConfig(),
        rxByte,
        rxByteHex;

    rxByte = state.rxSymbol
        ? state.rxSymbol - rxDspConfig.rxSymbolMin
        : null;
    rxByteHex = rxByte !== null ? byteToHex(rxByte) : '---';
    rxByteHexHistory.pushEvenIfFull(rxByteHex);

    html('#rx-byte-hex-history', rxByteHexHistory.getAll().join(' '));
    html('#rx-symbol', state.rxSymbol ? state.rxSymbol : 'idle');
    html('#rx-byte-hex', rxByteHex);
    setActive('#rx-byte-hex-container', '#rx-symbol-' + (state.rxSymbol ? state.rxSymbol : ''));
    log('log-rx-symbol', state);
}

function rxSampleDspDetailsListener(state) {
    state.rxFrequencyData = '[spectrogram array]';  // we don't want to show all the items in the log...
    log('log-rx-sample-dsp-details', state);
}

function rxSyncStatusListener(state) {
    html(
        '#rx-sync-status',
        (state.isRxSyncOk ? 'OK' : 'waiting...') +
        (state.isRxSyncInProgress ? ' [sync]' : '')
    );
    log('log-rx-sync-status', state);
}

function rxSyncDspDetailsListener(state) {
    log('log-rx-sync-dsp-details', state);
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
    log('log-rx-dsp-config', state);
}

function dspConfigListener(state) {
    html('#loopback', state.isLoopbackEnabled ? 'enabled' : 'disabled');
    html('#unit-time', state.unitTime.toFixed(2));
    log('log-dsp-config', state);
}

function txSymbolListener(state) {
    log('log-tx-symbol', state);
}

function txSymbolProgressListener(state) {
    log('log-tx-symbol-progress', state);
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
    html('#tx-amplitude', (state.txAmplitude * 100).toFixed(0));
    log('log-tx-dsp-config', state);
}

function log(elementId, object) {
    html('#' + elementId, JSON.stringify(object, null, 2));
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

function onSetUnitTimeClick(unitTime) {
    physicalLayer.setUnitTime(unitTime);
}

function onSetTxSampleRateClick(txSampleRate) {
    physicalLayer.setTxSampleRate(txSampleRate);
}

function onSetTxAmplitudeClick(txAmplitude) {
    physicalLayer.setTxAmplitude(txAmplitude);
}

function onTxSyncClick() {
    physicalLayer.txSync();
}
