// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_SYMBOL_HISTORY = 16,
    DIGIT_ZERO_SYMBOL = 100,
    SYMBOL_ZERO_PADDING = 3,
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
        .rxSampleListener(rxSampleListener)
        .rxSyncListener(rxSyncListener)
        .rxDspConfigListener(rxDspConfigListener)
        .txDspConfigListener(txDspConfigListener)
        .txListener(txListener)
        .build();

    rxSymbolHistory = new Buffer(RX_SYMBOL_HISTORY);
    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    txSampleRateWidget = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        physicalLayer.getTxDspConfig().sampleRate, 5, 0,
        onTxSampleRateWidgetChange
    );
    document.addEventListener(
        'keyup',
        function(e) {
            var digit = getDigitFromKeyCode(e.keyCode);

            if (digit !== null) {
                physicalLayer.sendSymbol(DIGIT_ZERO_SYMBOL + digit);
            }
        },
        true
    );
}

function formatSymbolRange(state) {
    var s;

    s = 'SymbolMin: ' + state.symbolMin + '&nbsp;(' + (state.symbolMin * state.symbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'SymbolMax: ' + state.symbolMax + '&nbsp;(' + (state.symbolMax * state.symbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'SymbolSpacing: ' + state.symbolFrequencySpacing.toFixed(2) + ' Hz';

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

    html('#rx-sample-rate', (state.sampleRate / 1000).toFixed(1));
    html(
        '#rx-config',
        formatSymbolRange(state) + '<br/>' +
        'FFT time: ' + (config.fftSize / state.sampleRate).toFixed(3) + ' s<br/>' +
        'Threshold: ' + state.signalDecibelThreshold.toFixed(1) + '&nbsp;dB'
    );

    powerBar.setSignalDecibelThreshold(state.signalDecibelThreshold);
}

function txDspConfigListener(state) {
    html('#tx-config', formatSymbolRange(state));

    setActive('#tx-amplitude-container', '#tx-amplitude-' + (state.amplitude * 10).toFixed(0));
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.sampleRate);

    if (txSampleRateWidget) {
        txSampleRateWidget.setValue(state.sampleRate);
    }
}

function rxSymbolListener(state) {
    rxSymbolHistory.pushEvenIfFull(state.symbol ? state.symbol : '---');
    html('#rx-symbol', state.symbol ? state.symbol : 'idle');
    html('#rx-symbol-history', getStringFromSymbolArray(rxSymbolHistory.getAll()));
}

function rxSampleListener(state) {
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
        'SignalFrequency: ' + (state.symbolRaw * rxDspConfig.symbolFrequencySpacing).toFixed(2) + ' Hz'
    );

    if (document.getElementById('spectrogram-active').checked) {
        rxSpectrogram.add(
            state.frequencyData,
            rxDspConfig.symbolMin,
            rxDspConfig.symbolMax,
            rxDspConfig.symbolFrequencySpacing,
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

function onAmplitudeClick(amplitude) {
    physicalLayer.setAmplitude(amplitude);
}

function onSendSyncClick() {
    physicalLayer.sendSync();
}

function onSendSymbolClick(symbol) {
    try {
        physicalLayer.sendSymbol(symbol);
    } catch (e) {
        alert(e);
    }
}

// -----------------------------------------------------------------


function pad(num, size) {
    var s = '000000000' + num;

    return s.substr(s.length - size);
}

function getStringFromSymbolArray(symbolArray) {
    var i, tmp, formatted = [];

    for (i = 0; i < symbolArray.length; i++) {
        tmp = pad(symbolArray[i], SYMBOL_ZERO_PADDING);
        formatted.push(tmp);
    }

    return formatted.join(' ');
}

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
