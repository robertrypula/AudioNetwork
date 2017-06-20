// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE = 1024,
    RX_RESOLUTION_EXPONENT = 2,
    
    RX_FFT_SIZE = FFT_SIZE * Math.pow(2, RX_RESOLUTION_EXPONENT),

    RX_FREQUENCY_MIN = 1000,
    RX_FREQUENCY_MAX = 4000,
    RX_TIME_MS = 500,
    TX_SAMPLE_RATE = 48000,
    TX_AMPLITUDE = 0.50,

    audioMonoIO,
    rxSpectrogram,
    rxSampleCount = 0,
    
    rxSmartTimer,
    rxFrequencyMin,
    rxFrequencyMax,

    txSampleRate,
    txIndexToTransmit;

function init() {
    audioMonoIO = new AudioMonoIO(RX_FFT_SIZE);
    document.getElementById('rx-sample-rate').innerHTML = audioMonoIO.getSampleRate();

    initFloatWidget();

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    rxSmartTimer = new SmartTimer(RX_TIME_MS / 1000);
    rxSmartTimer.setHandler(rxSmartTimerHandler);

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(document.getElementById('loopback-checkbox').checked);
    }
}

function getTransmitFrequency(symbol) {
    return symbol * txSampleRate.getValue() / FFT_SIZE;
}

function setTxSound(symbol) {
    var frequency;

    if (!symbol) {
        audioMonoIO.setPeriodicWave(0);
        return;
    }

    frequency = getTransmitFrequency(symbol);
    audioMonoIO.setPeriodicWave(frequency, TX_AMPLITUDE);
}

function initFloatWidget() {
    rxFrequencyMin = new EditableFloatWidget(
        document.getElementById('rx-frequency-min'),
        RX_FREQUENCY_MIN, 5, 0,
        null
    );
    rxFrequencyMax = new EditableFloatWidget(
        document.getElementById('rx-frequency-max'),
        RX_FREQUENCY_MAX, 5, 0,
        null
    );

    rxFrequencyMin.forceUpdate();
    rxFrequencyMax.forceUpdate();

    // ---

    txSampleRate = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        TX_SAMPLE_RATE, 5, 0,
        onTxSampleRateChange
    );
    txIndexToTransmit = new EditableFloatWidget(
        document.getElementById('tx-index-to-transmit'),
        0, 4, 0,
        onTxIndexToTransmitChange
    );
    txIndexToTransmit.forceUpdate();
}

// ----------------------

function onTxSampleRateChange() {
    txSampleRate.getValue();
    onTxIndexToTransmitChange();
}

function onTxIndexToTransmitChange() {
    var
        symbol = txIndexToTransmit.getValue(),
        hertz = getTransmitFrequency(symbol);

    html('#tx-index-to-transmit-frequency', hertz.toFixed(2) + ' Hz');
    onTxPlayChange();
}

// ----------------------

function onTxPlayChange() {
    var checked = document.getElementById('tx-play').checked;

    setTxSound(checked ? txIndexToTransmit.getValue() : 0);
}

// ----------------------

function rxSmartTimerHandler() {
    var
        frequencyData,
        fftResult,
        rxBinMin,
        rxBinMax,
        loudestBinIndex,
        frequencyDataInner = [],
        i;

    if (!document.getElementById('rx-active').checked) {
        return;
    }

    frequencyData = audioMonoIO.getFrequencyData();
    fftResult = new FFTResult(frequencyData, audioMonoIO.getSampleRate());

    fftResult.downconvert(RX_RESOLUTION_EXPONENT);
    rxSampleCount++;

    rxBinMin = fftResult.getBinIndex(rxFrequencyMin.getValue());
    rxBinMax = fftResult.getBinIndex(rxFrequencyMax.getValue());

    loudestBinIndex = fftResult.getLoudestBinIndexInBinRange(
        rxBinMin,
        rxBinMax
    );

    for (i = rxBinMin; i <= rxBinMax; i++) {
        frequencyDataInner.push(fftResult.getDecibel(i));
    }

    rxSpectrogram.add(
        frequencyDataInner,
        document.getElementById('loudest-marker').checked
            ? loudestBinIndex - rxBinMin
            : -1,
        rxBinMin,
        1,
        rxSampleCount % 2
    );

    html('#rx-frequency-bin', loudestBinIndex + ' (' + fftResult.getFrequency(loudestBinIndex).toFixed(2) + ' Hz)');

    html(
        '#rx-log',
        'Frequency bin index min&nbsp;&nbsp; : ' + rxBinMin + ' (' + fftResult.getFrequency(rxBinMin).toFixed(2) + 'Hz)<br/>' +
        'Frequency bin index max&nbsp;&nbsp; : ' + rxBinMax + ' (' + fftResult.getFrequency(rxBinMax).toFixed(2) + 'Hz)<br/>' +
        'Frequency bin index range : ' + (rxBinMax - rxBinMin + 1) + '<br/>'
    );
}

