// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_HISTORY_SIZE = 16,
    ASCII_NULL = 0x00,
    INITIAL_TX_AMPLITUDE = 0.2,
    powerBar,
    physicalLayerBuilder,
    physicalLayer,
    rxSymbolHistory,
    rxAsciiHistory;

function init() {
    powerBar = new PowerBar(document.getElementById('power-bar'));
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .txAmplitude(INITIAL_TX_AMPLITUDE)
        .rxSymbolListener(rxSymbolListener)
        .rxSampleListener(rxSampleListener)
        .rxSyncListener(rxSyncListener)
        .rxDspConfigListener(rxDspConfigListener)
        .txDspConfigListener(txDspConfigListener)
        .txListener(txListener)
        .dspConfigListener(dspConfigListener)
        .build();
    rxSymbolHistory = new Buffer(RX_HISTORY_SIZE);
    rxAsciiHistory = new Buffer(RX_HISTORY_SIZE);
}

function formatTxSymbolRange(state) {
    var s;

    s = 'SymbolMin: ' + state.txSymbolMin + '&nbsp;(' + (state.txSymbolMin * state.txSymbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'SymbolMax: ' + state.txSymbolMax + '&nbsp;(' + (state.txSymbolMax * state.txSymbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'SymbolSpacing: ' + state.txSymbolFrequencySpacing.toFixed(2) + ' Hz';

    return s;
}

function formatRxSymbolRange(state) {
    var s;

    s = 'SymbolMin: ' + state.rxSymbolMin + '&nbsp;(' + (state.rxSymbolMin * state.rxSymbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'SymbolMax: ' + state.rxSymbolMax + '&nbsp;(' + (state.rxSymbolMax * state.rxSymbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'SymbolSpacing: ' + state.rxSymbolFrequencySpacing.toFixed(2) + ' Hz';

    return s;
}

// ----------------------------------

function rxDspConfigListener(state) {
    var config = physicalLayer.getDspConfig();

    html('#rx-sample-rate', (state.rxSampleRate / 1000).toFixed(1));
    html(
        '#rx-config',
        formatRxSymbolRange(state) + '<br/>' +
        'FFT time: ' + (config.fftSize / state.rxSampleRate).toFixed(3) + ' s<br/>' +
        'Threshold: ' + state.rxSignalDecibelThreshold.toFixed(1) + '&nbsp;dB'
    );

    powerBar.setSignalDecibelThreshold(state.rxSignalDecibelThreshold);
}

function txDspConfigListener(state) {
    html('#tx-config', formatTxSymbolRange(state));

    setActive('#tx-amplitude-container', '#tx-amplitude-' + (state.txAmplitude * 10).toFixed(0));
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.txSampleRate);
}

function rxSymbolListener(state) {
    var
        rxDspConfig = physicalLayer.getRxDspConfig(),
        charCode,
        char;

    rxSymbolHistory.pushEvenIfFull(state.symbol ? state.symbol : '---');
    charCode = state.symbol - rxDspConfig.rxSymbolMin;
    char = String.fromCharCode(charCode);
    rxAsciiHistory.pushEvenIfFull(
        isPrintableAscii(char) ? char : UNICODE_UNKNOWN
    );

    html('#rx-symbol', state.symbol ? state.symbol : 'idle');
    html('#rx-symbol-history', getStringFromSymbolArray(rxSymbolHistory.getAll()));
    html('#rx-ascii-history', rxAsciiHistory.getAll().join(''));
}

function rxSampleListener(state) {
    var rxDspConfig = physicalLayer.getRxDspConfig();

    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');

    html(
        '#rx-sample',
        'SampleNumber: ' + state.sampleNumber + '<br/>' +
        'Offset: ' + state.offset + '<br/>' +
        'IsSymbolSamplingPoint: ' + (state.isSymbolSamplingPoint ? 'yes' : 'no') + '<br/>' +
        'SymbolRaw: ' + state.symbolRaw + '<br/>' +
        'SignalFrequency: ' + (state.symbolRaw * rxDspConfig.rxSymbolFrequencySpacing).toFixed(2) + ' Hz'
    );

    powerBar.setSignalDecibel(state.signalDecibel);
    powerBar.setNoiseDecibel(state.noiseDecibel);
}

function rxSyncListener(state) {
    powerBar.setSignalDecibelAverage(state.signalDecibelAverage);
    powerBar.setNoiseDecibelAverage(state.noiseDecibelAverage);
}

function txListener(state) {
    html('#tx-symbol', state.symbol ? state.symbol : 'idle');
    html('#tx-symbol-queue', getStringFromSymbolArray(state.symbolQueue));
}

function dspConfigListener(state) {
    setActive(
        '#loopback-container',
        '#loopback-' + (state.isLoopbackEnabled ? 'enabled' : 'disabled')
    );
}

// ----------------------------------

function onLoopbackClick(state) {
    physicalLayer.setLoopback(state);
}

function onTxSampleRateClick(txSampleRate) {
    physicalLayer.setTxSampleRate(txSampleRate);
}

function onAmplitudeClick(txAmplitude) {
    physicalLayer.setTxAmplitude(txAmplitude);
}

function onTxSyncClick() {
    physicalLayer.txSync();
}

function onTxSymbolClick() {
    var txSymbol = getFormFieldValue('#tx-symbol-field');

    try {
        physicalLayer.txSymbol(txSymbol);
    } catch (e) {
        alert(e); // it's because user may enter symbol out of range
    }
}

function onSendTextClick() {
    var
        text = getFormFieldValue('#tx-text-field'),
        txDspConfig = physicalLayer.getTxDspConfig(),
        txSymbolMin = txDspConfig.txSymbolMin,
        byte,
        txSymbol,
        i;

    for (i = 0; i < text.length; i++) {
        byte = isPrintableAscii(text[i])
            ? text.charCodeAt(i)
            : ASCII_NULL;
        txSymbol = txSymbolMin + byte;
        physicalLayer.txSymbol(txSymbol);
    }
}
