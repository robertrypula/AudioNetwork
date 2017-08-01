// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    BUFFER_SIZE = 16,
    DIGIT_ZERO_SYMBOL = 100,
    INITIAL_AMPLITUDE = 0.2,
    SYMBOL_ZERO_PADDING = 3,
    physicalLayerBuilder,
    physicalLayer,
    rxSpectrogram,
    rxSymbolList,
    txSampleRateWidget;

function init() {
    physicalLayerBuilder = new PhysicalLayerV2Builder();
    physicalLayer = physicalLayerBuilder
        .amplitude(INITIAL_AMPLITUDE)
        .symbolMin44100(100)
        .symbolMin48000(100)
        .symbolMinDefault(100)
        .symbolRange(10)
        .configListener(configListener)
        .rxSymbolListener(rxSymbolListener)
        .rxSampleListener(rxSampleListener)
        .rxSyncListener(rxSyncListener)
        .rxConfigListener(rxConfigListener)
        .txConfigListener(txConfigListener)
        .txListener(txListener)
        .build();

    rxSymbolList = new Buffer(BUFFER_SIZE);
    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    txSampleRateWidget = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        physicalLayer.getTxConfig().sampleRate, 5, 0,
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

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    physicalLayer.setLoopback(
        document.getElementById('loopback-checkbox').checked
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

function configListener(state) {
    html(
        '#config',
        'FftSkipFactor: ' + state.fftSkipFactor + '<br/>' +
        'FftSize: ' + state.fftSize + '<br/>' +
        'SamplePerSymbol: ' + state.samplePerSymbol + '<br/>' +
        'UnitTime: ' + state.unitTime + ' s<br/>' +
        'CorrelationCodeLength: ' + state.correlationCodeLength
    );
}

function rxConfigListener(state) {
    var config = physicalLayer.getConfig();

    html(
        '#rx-config',
        '<strong>SampleRate: ' + (state.sampleRate / 1000).toFixed(1) + '&nbsp;kHz</strong><br/>' +
        formatSymbolRange(state) + '<br/>' +
        'FFT time: ' + (config.fftSize / state.sampleRate).toFixed(3) + ' s<br/>' +
        'Threshold: ' + state.signalDecibelThreshold.toFixed(1) + '&nbsp;dB'
    );
}

function txConfigListener(state) {
    html('#tx-config', formatSymbolRange(state));

    setActive('#tx-amplitude-container', '#tx-amplitude-' + (state.amplitude * 10).toFixed(0));
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.sampleRate);

    if (txSampleRateWidget) {
        txSampleRateWidget.setValue(state.sampleRate);
    }
}

function rxSymbolListener(state) {
    rxSymbolList.pushEvenIfFull(state.symbol ? state.symbol : '---');
    html('#rx-symbol', 'Symbol: ' + (state.symbol ? state.symbol : 'idle'));
    html(
        '#rx-symbol-list',
        'Symbol list: ' + getStringFromSymbolList(rxSymbolList.getAll())
    );
}

function rxSampleListener(state) {
    var
        rxConfig = physicalLayer.getRxConfig(),
        s;

    s = state.isSyncInProgress
        ? 'Sync in progress...'
        : (state.syncId ? 'Synchronized!' : 'Not synchronized yet');

    html('#rx-sync-simple', s);
    html(
        '#rx-sample',
        'SymbolRaw: ' + state.symbolRaw + ' (' + state.signalDecibel.toFixed(1) + ' dB)<br/>' +
        state.offset + '/' + state.sampleNumber + ', ' + (state.symbolRaw * rxConfig.symbolFrequencySpacing).toFixed(2) + ' Hz'
    );

    // TODO update spectrogram
    if (false && document.getElementById('rx-active').checked) {
        rxSpectrogram.add(
            state.band.frequencyData,
            document.getElementById('loudest-marker').checked ? state.band.frequencyDataLoudestIndex : -1,
            state.band.symbolMin,
            1,
            state.isSymbolReadyToTake
        );
    }
}

function rxSyncListener(state) {
    var config = physicalLayer.getConfig();

    html(
        '#rx-sync',
        'ID: ' + state.id + '<br/>' +
        'SymbolSamplingPointOffset: ' + state.symbolSamplingPointOffset + '<br/>' +
        'CorrelationValue: ' + state.correlationValue + ' in range <-' + config.correlationCodeLength + ',+' + config.correlationCodeLength + '><br/>' +
        'SignalDecibelAverage: ' + state.signalDecibelAverage.toFixed(2) + ' dB<br/>' +
        'NoiseDecibelAverage: ' + state.noiseDecibelAverage.toFixed(2) + ' dB<br/>' +
        'SignalToNoiseRatio: ' + state.signalToNoiseRatio.toFixed(2) + ' dB'
    );
}

function txListener(state) {
    html(
        '#tx-symbol-queue',
        'Now transmistting: ' + (state.symbol ? state.symbol : 'idle') + '<br/>' +
        getStringFromSymbolList(state.symbolQueue)
    );
}

// ----------------------------------

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
    physicalLayer.sendSyncCode();
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

function getStringFromSymbolList(symbolList) {
    var i, tmp, formatted = [];

    for (i = 0; i < symbolList.length; i++) {
        tmp = pad(symbolList[i], SYMBOL_ZERO_PADDING);
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
