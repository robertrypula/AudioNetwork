// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    BUFFER_SIZE = 16,
    ASCII_NULL = 0x00,
    SYMBOL_ZERO_PADDING = 3,
    INITIAL_AMPLITUDE = 0.2,
    UNICODE_UNKNOWN = '�',
    powerBar,
    physicalLayerBuilder,
    physicalLayer,
    rxSymbolList,
    rxAsciiList;

function init() {
    powerBar = new PowerBar(document.getElementById('power-bar'));
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .amplitude(INITIAL_AMPLITUDE)
        .rxSymbolListener(rxSymbolListener)
        .rxSampleListener(rxSampleListener)
        .rxSyncListener(rxSyncListener)
        .rxConfigListener(rxConfigListener)
        .txConfigListener(txConfigListener)
        .txListener(txListener)
        .configListener(configListener)
        .build();
    rxSymbolList = new Buffer(BUFFER_SIZE);
    rxAsciiList = new Buffer(BUFFER_SIZE);
}

function formatSymbolRange(state) {
    var s;

    s = 'SymbolMin: ' + state.symbolMin + '&nbsp;(' + (state.symbolMin * state.symbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'SymbolMax: ' + state.symbolMax + '&nbsp;(' + (state.symbolMax * state.symbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'SymbolSpacing: ' + state.symbolFrequencySpacing.toFixed(2) + ' Hz';

    return s;
}

// ----------------------------------

function rxConfigListener(state) {
    var config = physicalLayer.getConfig();

    html('#rx-sample-rate', (state.sampleRate / 1000).toFixed(1));
    html(
        '#rx-config',
        formatSymbolRange(state) + '<br/>' +
        'FFT time: ' + (config.fftSize / state.sampleRate).toFixed(3) + ' s<br/>' +
        'Threshold: ' + state.signalDecibelThreshold.toFixed(1) + '&nbsp;dB'
    );

    powerBar.setSignalDecibelThreshold(state.signalDecibelThreshold);
}

function txConfigListener(state) {
    html('#tx-config', formatSymbolRange(state));

    setActive('#tx-amplitude-container', '#tx-amplitude-' + (state.amplitude * 10).toFixed(0));
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.sampleRate);
}

function rxSymbolListener(state) {
    var
        rxConfig = physicalLayer.getRxConfig(),
        charCode,
        char;

    rxSymbolList.pushEvenIfFull(state.symbol ? state.symbol : '---');
    charCode = state.symbol - rxConfig.symbolMin;
    char = String.fromCharCode(charCode);
    rxAsciiList.pushEvenIfFull(
        isPrintableAscii(char) ? char : UNICODE_UNKNOWN
    );

    html('#rx-symbol', state.symbol ? state.symbol : 'idle');
    html('#rx-symbol-list', getStringFromSymbolList(rxSymbolList.getAll()));
    html('#rx-symbol-as-ascii', rxAsciiList.getAll().join(''));
}

function rxSampleListener(state) {
    var rxConfig = physicalLayer.getRxConfig();

    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');

    html(
        '#rx-sample',
        'SampleNumber: ' + state.sampleNumber + '<br/>' +
        'Offset: ' + state.offset + '<br/>' +
        'IsSymbolSamplingPoint: ' + (state.isSymbolSamplingPoint ? 'yes' : 'no') + '<br/>' +
        'SymbolRaw: ' + state.symbolRaw + '<br/>' +
        'SignalDecibel: ' + state.signalDecibel.toFixed(1) + ' dB<br/>' +
        'SignalFrequency: ' + (state.symbolRaw * rxConfig.symbolFrequencySpacing).toFixed(2) + ' Hz'
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
    html('#tx-symbol-queue', getStringFromSymbolList(state.symbolQueue));
}
function configListener(state) {
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

function onAmplitudeClick(amplitude) {
    physicalLayer.setAmplitude(amplitude);
}

function onSendSyncClick() {
    physicalLayer.sendSync();
}

function onSendSymbolClick() {
    var symbol = getFormFieldValue('#tx-symbol-field');

    try {
        physicalLayer.sendSymbol(symbol);
    } catch (e) {
        alert(e); // it's because user may enter symbol out of range
    }
}

function onSendTextClick() {
    var
        text = getFormFieldValue('#tx-text-field'),
        txConfig = physicalLayer.getTxConfig(),
        symbolMin = txConfig.symbolMin,
        byte,
        symbol,
        i;

    for (i = 0; i < text.length; i++) {
        byte = isPrintableAscii(text[i])
            ? text.charCodeAt(i)
            : ASCII_NULL;
        symbol = symbolMin + byte;
        physicalLayer.sendSymbol(symbol);
    }
}

// ----------------------------------

function isPrintableAscii(char) {
    return char >= ' ' && char <= '~';
}

function pad(num, size) {
    var s = '000000000' + num;

    return s.substr(s.length - size);
}

function getStringFromSymbolList(symbolList) {
    var i, tmp, formatted = [];

    for (i = 0; i < symbolList.length; i++) {
        tmp = pad(symbolList[i], SYMBOL_ZERO_PADDING);
        formatted.push(tmp);
    }

    return formatted.join(' ');
}
