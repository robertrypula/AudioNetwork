// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_SYMBOL_HISTORY = 16,
    DIGIT_ZERO_SYMBOL = 100,
    powerBar,
    physicalLayerBuilder,
    physicalLayer,
    rxSpectrogram,
    rxSymbolHistory,
    txSampleRateWidget;

function init() {
    powerBar = new PowerBar(document.getElementById('power-bar'));
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .symbolMin44100(100)
        .symbolMin48000(100)
        .symbolMinDefault(100)
        .symbolRange(10)
        .dspConfigListener(dspConfigListener)
        .rxSymbolListener(rxSymbolListener)
        .rxSampleDspDetailsListener(rxSampleDspDetailsListener)
        .rxSyncListener(rxSyncListener)
        .rxDspConfigListener(rxDspConfigListener)
        .txDspConfigListener(txDspConfigListener)
        .txListener(txListener)
        .build();

    rxSymbolHistory = new Buffer(RX_SYMBOL_HISTORY);
    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    txSampleRateWidget = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        physicalLayer.getTxDspConfig().txSampleRate, 5, 0,
        onTxSampleRateWidgetChange
    );
    document.addEventListener(
        'keyup',
        function(e) {
            var
                digit = getDigitFromKeyCode(e.keyCode),
                txSymbol;

            if (digit !== null) {
                txSymbol = DIGIT_ZERO_SYMBOL + digit;
                physicalLayer.txSymbol(txSymbol);
            }
        },
        true
    );
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

function dspConfigListener(state) {
    html(
        '#config',
        'FftSkipFactor: ' + state.fftSkipFactor + '<br/>' +
        'FftSize: ' + state.fftSize + '<br/>' +
        'SamplePerSymbol: ' + state.samplePerSymbol + '<br/>' +
        'UnitTime: ' + state.unitTime + ' s<br/>' +
        'CorrelationCodeLength: ' + state.correlationCodeLength
    );
    setActive(
        '#loopback-container',
        '#loopback-' + (state.isLoopbackEnabled ? 'enabled' : 'disabled')
    );
}

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

    if (txSampleRateWidget) {
        txSampleRateWidget.setValue(state.txSampleRate);
    }
}

function rxSymbolListener(state) {
    rxSymbolHistory.pushEvenIfFull(state.symbol ? state.symbol : '---');
    html('#rx-symbol', state.symbol ? state.symbol : 'idle');
    html('#rx-symbol-history', getStringFromSymbolArray(rxSymbolHistory.getAll()));
}

function rxSampleDspDetailsListener(state) {
    var
        rxDspConfig = physicalLayer.getRxDspConfig(),
        rxSymbol = physicalLayer.getRxSymbol();

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

    if (document.getElementById('spectrogram-active').checked) {
        rxSpectrogram.add(
            state.frequencyData,
            rxDspConfig.rxSymbolMin,
            rxDspConfig.rxSymbolMax,
            rxDspConfig.rxSymbolFrequencySpacing,
            document.getElementById('symbol-marker-active').checked && rxSymbol.symbol
                ? rxSymbol.symbol
                : Spectrogram.INDEX_MARKER_DISABLED,
            state.isSymbolSamplingPoint
                ? Spectrogram.ROW_MARKER_ENABLED
                : Spectrogram.ROW_MARKER_DISABLED
        );
    }

    powerBar.setSignalDecibel(state.signalDecibel);
    powerBar.setNoiseDecibel(state.noiseDecibel);
}

function rxSyncListener(state) {
    var config = physicalLayer.getDspConfig();

    html(
        '#rx-sync',
        'ID: ' + state.id + '<br/>' +
        'SymbolSamplingPointOffset: ' + state.symbolSamplingPointOffset + '<br/>' +
        'CorrelationValue: ' + state.correlationValue + ' in range <-' + config.correlationCodeLength + ',+' + config.correlationCodeLength + '><br/>' +
        'SignalDecibelAverage: ' + state.signalDecibelAverage.toFixed(2) + ' dB<br/>' +
        'NoiseDecibelAverage: ' + state.noiseDecibelAverage.toFixed(2) + ' dB<br/>' +
        'SignalToNoiseRatio: ' + state.signalToNoiseRatio.toFixed(2) + ' dB'
    );

    powerBar.setSignalDecibelAverage(state.signalDecibelAverage);
    powerBar.setNoiseDecibelAverage(state.noiseDecibelAverage);
}

function txListener(state) {
    html('#tx-symbol', state.symbol ? state.symbol : 'idle');
    html('#tx-symbol-queue', getStringFromSymbolArray(state.symbolQueue));
}

// ----------------------------------

function onLoopbackClick(state) {
    physicalLayer.setLoopback(state);
}

function onTxSampleRateWidgetChange() {
    physicalLayer.setTxSampleRate(txSampleRateWidget.getValue());
}

function onSampleRateClick(sampleRate) {
    physicalLayer.setTxSampleRate(sampleRate);
}

function onAmplitudeClick(txAmplitude) {
    physicalLayer.setTxAmplitude(txAmplitude);
}

function onTxSyncClick() {
    physicalLayer.txSync();
}

function onTxSymbolClick(txSymbol) {
    try {
        physicalLayer.txSymbol(txSymbol);
    } catch (e) {
        alert(e);
    }
}

// -----------------------------------------------------------------

function getDigitFromKeyCode(keyCode) {
    var digit = null;

    // digits from standard keys and numeric keys
    if (keyCode >= 48 && keyCode <= 57) {
        digit = keyCode - 48;
    } else {
        if (keyCode >= 96 && keyCode <= 105) {
            digit = keyCode - 96;
        }
    }

    return digit;
}
