// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_FFT_SIZE_EXPONENT = 13,
    TX_FFT_SIZE_EXPONENT = RX_FFT_SIZE_EXPONENT - 2,
    FREQUENCY_MIN = 1500,   // TODO align with TX frequency bin
    FREQUENCY_TX = 1650,
    FREQUENCY_MAX = 1700,
    RX_TIME_MS = 200,
    TX_TIME_MS = 600,
    TX_SAMPLE_RATE = 48000,
    TX_AMPLITUDE = 0.05,

    audioMonoIO,
    domLoopbackCheckbox,
    rxSpectrogram,

    rxFrequencyCalculator,
    rxSmartTimer,
    rxFftSizeExponent,
    rxTimeMs,
    rxIndexMin,
    rxIndexMax,
    rxResolutionExponent,

    txFrequencyCalculator,
    txSampleRate,
    txSmartTimer,
    txFftSizeExponent,
    txTimeMs,
    txIndexMin,
    txIndexMax,
    txIndexToTransmit,
    txAmplitude,
    txFineTune;

function init() {
    audioMonoIO = new AudioMonoIO(Math.pow(2, RX_FFT_SIZE_EXPONENT));
    rxFrequencyCalculator = new FrequencyCalculator(
        function () {
            return audioMonoIO.getSampleRate();
        },
        function () {
            return Math.pow(2, rxFftSizeExponent.getValue());
        }
    );
    txFrequencyCalculator = new FrequencyCalculator(
        function () {
            return txSampleRate.getValue();
        },
        function () {
            return Math.pow(2, txFftSizeExponent.getValue());
        }
    );

    document.getElementById('rx-sample-rate').innerHTML = audioMonoIO.getSampleRate();
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');

    initFloatWidget();

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));

    rxSmartTimer = new SmartTimer(
        rxTimeMs.getValue() / 1000
    );
    rxSmartTimer.setHandler(rxSmartTimerHandler);

    txSmartTimer = new SmartTimer(
        txTimeMs.getValue() / 1000
    );
    txSmartTimer.setHandler(txSmartTimerHandler);

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
    }
}

function initFloatWidget() {
    rxFftSizeExponent = new EditableFloatWidget(
        document.getElementById('rx-fft-size-exponent'),
        RX_FFT_SIZE_EXPONENT, 2, 0,
        onRxFftSizeExponentChange
    );
    rxTimeMs = new EditableFloatWidget(
        document.getElementById('rx-time-ms'),
        RX_TIME_MS, 4, 0,
        onRxTimeMsChange
    );
    rxIndexMin = new EditableFloatWidget(
        document.getElementById('rx-index-min'),
        Math.round(Math.pow(2, rxFftSizeExponent.getValue()) * FREQUENCY_MIN / audioMonoIO.getSampleRate()), 4, 0,
        onRxIndexMinChange
    );
    rxIndexMax = new EditableFloatWidget(
        document.getElementById('rx-index-max'),
        Math.round(Math.pow(2, rxFftSizeExponent.getValue()) * FREQUENCY_MAX / audioMonoIO.getSampleRate()), 4, 0,
        onRxIndexMaxChange
    );
    rxResolutionExponent = new EditableFloatWidget(
        document.getElementById('rx-resolution-exponent'),
        2, 1, 0,
        onRxResolutionExponentChange
    );

    rxFftSizeExponent.forceUpdate();
    rxIndexMin.forceUpdate();
    rxIndexMax.forceUpdate();
    rxResolutionExponent.forceUpdate();

    // ---

    txSampleRate = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        TX_SAMPLE_RATE, 5, 0,
        onTxSampleRateChange
    );
    txFftSizeExponent = new EditableFloatWidget(
        document.getElementById('tx-fft-size-exponent'),
        TX_FFT_SIZE_EXPONENT, 2, 0,
        onTxFftSizeExponentChange
    );
    txTimeMs = new EditableFloatWidget(
        document.getElementById('tx-time-ms'),
        TX_TIME_MS, 4, 0,
        onTxTimeMsChange
    );
    txIndexMin = new EditableFloatWidget(
        document.getElementById('tx-index-min'),
        Math.round(Math.pow(2, txFftSizeExponent.getValue()) * FREQUENCY_MIN / audioMonoIO.getSampleRate()), 4, 0,
        onTxIndexMinChange
    );
    txIndexMax = new EditableFloatWidget(
        document.getElementById('tx-index-max'),
        Math.round(Math.pow(2, txFftSizeExponent.getValue()) * FREQUENCY_MAX / audioMonoIO.getSampleRate()), 4, 0,
        onTxIndexMaxChange
    );
    txIndexToTransmit = new EditableFloatWidget(
        document.getElementById('tx-index-to-transmit'),
        Math.round(Math.pow(2, txFftSizeExponent.getValue()) * FREQUENCY_TX / audioMonoIO.getSampleRate()), 4, 0,
        onTxIndexToTransmitChange
    );
    txAmplitude = new EditableFloatWidget(
        document.getElementById('tx-amplitude'),
        TX_AMPLITUDE, 1, 9,
        onTxAmplitudeChange
    );
    txFineTune = new EditableFloatWidget(
        document.getElementById('tx-fine-tune'),
        50, 2, 9,
        onTxFineTuneChange
    );

    txFftSizeExponent.forceUpdate();
    txIndexMin.forceUpdate();
    txIndexMax.forceUpdate();
    txIndexToTransmit.forceUpdate();
}

// ----------------------

function onRxFftSizeExponentChange() {
    var fftSize;

    fftSize = Math.pow(2, rxFftSizeExponent.getValue());
    audioMonoIO.setFFTSize(fftSize);

    html('#rx-fft-size', fftSize);
    html('#rx-fft-size-time', (1000 * fftSize / audioMonoIO.getSampleRate()).toFixed(1) + ' ms');
    html('#rx-fft-size-resolution', (audioMonoIO.getSampleRate() / fftSize).toFixed(6) + ' Hz');

    rxIndexMin.forceUpdate();
    rxIndexMax.forceUpdate();
}

function onRxTimeMsChange() {
    rxSmartTimer.setInterval(
        rxTimeMs.getValue() / 1000
    );
}

function onRxIndexMinChange() {
    var hertz = rxFrequencyCalculator.getHertzFromCyclePerWindow(rxIndexMin.getValue());

    html('#rx-index-min-frequency', hertz.toFixed(6) + ' Hz');
}

function onRxIndexMaxChange() {
    var hertz = rxFrequencyCalculator.getHertzFromCyclePerWindow(rxIndexMax.getValue());

    html('#rx-index-max-frequency', hertz.toFixed(6) + ' Hz');
}

function onRxResolutionExponentChange() {
    html('#rx-resolution-value', Math.pow(2, rxResolutionExponent.getValue()));
}

// ---

function onTxSampleRateChange() {
    txSampleRate.getValue();

    txIndexMin.forceUpdate();
    txIndexMax.forceUpdate();
}

function onTxFftSizeExponentChange() {
    var fftSize;

    fftSize = Math.pow(2, txFftSizeExponent.getValue());

    html('#tx-fft-size', fftSize);
    html('#tx-fft-size-resolution', (txSampleRate.getValue() / fftSize).toFixed(6) + ' Hz');

    txIndexMin.forceUpdate();
    txIndexMax.forceUpdate();
}

function onTxTimeMsChange() {
    txSmartTimer.setInterval(
        txTimeMs.getValue() / 1000
    );
}

function onTxIndexMinChange() {
    var hertz = txFrequencyCalculator.getHertzFromCyclePerWindow(txIndexMin.getValue());

    html('#tx-index-min-frequency', hertz.toFixed(6) + ' Hz');
    onTxImmediatelyChange();
}

function onTxIndexMaxChange() {
    var hertz = txFrequencyCalculator.getHertzFromCyclePerWindow(txIndexMax.getValue());

    html('#tx-index-max-frequency', hertz.toFixed(6) + ' Hz');
    onTxImmediatelyChange();
}

function onTxIndexToTransmitChange() {
    var hertz = txFrequencyCalculator.getHertzFromCyclePerWindow(txIndexToTransmit.getValue());

    html('#tx-index-to-transmit-frequency', hertz.toFixed(6) + ' Hz');
    onTxImmediatelyChange();
}

function onTxAmplitudeChange() {
    onTxImmediatelyChange();
}

function onTxFineTuneChange() {
    onTxImmediatelyChange();
}

// ----------------------

function onTxImmediatelyChange() {
    var
        checked = document.getElementById('tx-immediately').checked,
        frequency,
        frequencyFineTune;

    if (checked) {
        frequency = txFrequencyCalculator.getHertzFromCyclePerWindow(txIndexToTransmit.getValue());
        frequencyFineTune = txFineTune.getValue();
        audioMonoIO.setPeriodicWave(
            frequency - 50 + frequencyFineTune,   // TODO negative values in widget are missing, fix it!!
            txAmplitude.getValue()
        );
    } else {
        audioMonoIO.setPeriodicWave(0);
    }
}

// ----------------------

function rxSmartTimerHandler() {
    var
        frequencyData = audioMonoIO.getFrequencyData(),
        fftResult = new FFTResult(frequencyData, audioMonoIO.getSampleRate()),
        loudestBinIndex,
        loudestHertz,
        htmlLog,
        frequencyDataInner = [],
        rxResolutionValue,
        indexSpan,
        i;

    loudestBinIndex = fftResult.getLoudestBinIndex(
        fftResult.getFrequency(rxIndexMin.getValue()),
        fftResult.getFrequency(rxIndexMax.getValue())
    );
    loudestHertz = fftResult.getFrequency(loudestBinIndex);

    rxResolutionValue = Math.pow(2, rxResolutionExponent.getValue());

    html('#rx-frequency-bin', Math.round(loudestBinIndex / rxResolutionValue));

    indexSpan = 3 * rxResolutionValue;
    htmlLog = '';
    for (i = -indexSpan; i <= indexSpan; i++) {
        htmlLog += '' +
            'Decibels at ' +
            '[' +
            'rx = ' + (loudestBinIndex + i) + ', ' +
            'tx = ' + ((loudestBinIndex + i) / rxResolutionValue).toFixed(3) +
            ']: ' +
            frequencyData[loudestBinIndex + i].toFixed(6) +
            ' dB' + (i === 0 ? ' <--- loudest' : '') +
            '<br/>';
    }
    html('#spectrogram-log', htmlLog);

    for (i = rxIndexMin.getValue(); i <= rxIndexMax.getValue(); i++) {
        frequencyDataInner.push(frequencyData[i]);
    }

    rxSpectrogram.add(frequencyDataInner);
}

function txSmartTimerHandler() {
    console.log('TX timer');
}
