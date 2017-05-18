// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE_EXPONENT = 12,
    RX_TIME_MS = 250,
    TX_TIME_MS = 750,
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
    audioMonoIO = new AudioMonoIO(Math.pow(2, FFT_SIZE_EXPONENT));
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
        FFT_SIZE_EXPONENT, 2, 0,
        onRxFftSizeExponentChange
    );
    rxTimeMs = new EditableFloatWidget(
        document.getElementById('rx-time-ms'),
        RX_TIME_MS, 4, 0,
        onRxTimeMsChange
    );
    rxIndexMin = new EditableFloatWidget(
        document.getElementById('rx-index-min'),
        Math.round(Math.pow(2, rxFftSizeExponent.getValue()) * 1500 / audioMonoIO.getSampleRate()), 4, 0,
        onRxIndexMinChange
    );
    rxIndexMax = new EditableFloatWidget(
        document.getElementById('rx-index-max'),
        Math.round(Math.pow(2, rxFftSizeExponent.getValue()) * 2000 / audioMonoIO.getSampleRate()), 4, 0,
        onRxIndexMaxChange
    );

    rxFftSizeExponent.forceUpdate();
    rxIndexMin.forceUpdate();
    rxIndexMax.forceUpdate();

    // ---

    txSampleRate = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        TX_SAMPLE_RATE, 5, 0,
        onTxSampleRateChange
    );
    txFftSizeExponent = new EditableFloatWidget(
        document.getElementById('tx-fft-size-exponent'),
        FFT_SIZE_EXPONENT, 2, 0,
        onTxFftSizeExponentChange
    );
    txTimeMs = new EditableFloatWidget(
        document.getElementById('tx-time-ms'),
        TX_TIME_MS, 4, 0,
        onTxTimeMsChange
    );
    txIndexMin = new EditableFloatWidget(
        document.getElementById('tx-index-min'),
        Math.round(Math.pow(2, txFftSizeExponent.getValue()) * 1500 / audioMonoIO.getSampleRate()), 4, 0,
        onTxIndexMinChange
    );
    txIndexMax = new EditableFloatWidget(
        document.getElementById('tx-index-max'),
        Math.round(Math.pow(2, txFftSizeExponent.getValue()) * 2000 / audioMonoIO.getSampleRate()), 4, 0,
        onTxIndexMaxChange
    );
    txIndexToTransmit = new EditableFloatWidget(
        document.getElementById('tx-index-to-transmit'),
        Math.round(Math.pow(2, txFftSizeExponent.getValue()) * 1750 / audioMonoIO.getSampleRate()), 4, 0,
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
        i;

    loudestBinIndex = fftResult.getLoudestBinIndex(
        fftResult.getFrequency(rxIndexMin.getValue()),
        fftResult.getFrequency(rxIndexMax.getValue())
    );
    loudestHertz = fftResult.getFrequency(loudestBinIndex);

    htmlLog = '' +
        'Loudest bin index: ' + loudestBinIndex + '<br/>' +
        'Decibels at [' + (loudestBinIndex - 2) + ']: ' + frequencyData[loudestBinIndex - 2].toFixed(6) + ' dB<br/>' +
        'Decibels at [' + (loudestBinIndex - 1) + ']: ' + frequencyData[loudestBinIndex - 1].toFixed(6) + ' dB<br/>' +
        'Decibels at [' + (loudestBinIndex + 0) + ']: ' + frequencyData[loudestBinIndex].toFixed(6) + ' dB <- max<br/>' +
        'Decibels at [' + (loudestBinIndex + 1) + ']: ' + frequencyData[loudestBinIndex + 1].toFixed(6) + ' dB<br/>' +
        'Decibels at [' + (loudestBinIndex + 2) + ']: ' + frequencyData[loudestBinIndex + 2].toFixed(6) + ' dB<br/>' +
        'Loudest frequency: ' + loudestHertz.toFixed(6) + ' Hz<br/>' +
        '';
    html('#spectrogram-log', htmlLog);

    for (i = rxIndexMin.getValue(); i <= rxIndexMax.getValue(); i++) {
        frequencyDataInner.push(frequencyData[i]);
    }

    rxSpectrogram.add(frequencyDataInner);
}

function txSmartTimerHandler() {
    console.log('TX timer');
}

// ----------------------

/*
var
    audioMonoIO,
    fftSize,
    range,
    rxTimestep,
    txTimestep,
    txData,
    txDataIndex,
    carrierFrequency,
    carrierFrequencyBinIndex,
    frequencyMin,
    frequencyMax,
    smartTimer;

function init() {
    smartTimer = new SmartTimer(0.2);
    smartTimer.setHandler(function () {
        var now = new Date();
        console.log(now.getMinutes() + ':' + now.getSeconds() + '.' + now.getMilliseconds());
    });

    fftSize = getValue('#fft-size', 'int');
    range = getValue('#range', 'int');
    audioMonoIO = new AudioMonoIO(fftSize);
    // audioMonoIO.setVolume(0.1);
    // audioMonoIO.setLoopback(true);

    carrierFrequency = getValue('#carrier-frequency', 'float');
    carrierFrequency = FFTResult.getFrequencyOfClosestBin(carrierFrequency, audioMonoIO.getSampleRate(), fftSize);
    setValue('#carrier-frequency', carrierFrequency);
    carrierFrequencyBinIndex = FFTResult.getBinIndex(carrierFrequency, audioMonoIO.getSampleRate(), fftSize);

    txData = getValue('#tx-data').split(' ');
    txDataIndex = 0;

    frequencyMin = carrierFrequency - range * FFTResult.getResolution(audioMonoIO.getSampleRate(), fftSize);
    frequencyMax = carrierFrequency + range * FFTResult.getResolution(audioMonoIO.getSampleRate(), fftSize);

    html(
        '#log',
        'FFT window duration: ' + (1000 * fftSize / audioMonoIO.getSampleRate()).toFixed(2) + ' ms<br/>' +
        'FFT resolution: ' + FFTResult.getResolution(audioMonoIO.getSampleRate(), fftSize) + ' Hz<br/>' +
        'Frequency min: ' + frequencyMin.toFixed(2) + ' Hz<br/>' +
        'Frequency max: ' + frequencyMax.toFixed(2) + ' Hz<br/><br/>',
        true
    );

    setInterval(log, 1000);
}

function getIndex(data, type) {
    var index, condition, value, i;

    index = -1;
    value = undefined;
    condition = 0;
    for (i = 0; i < data.length; i++) {
        switch (type) {
            case 'min':
                condition = data[i] < value;
                break;
            case 'max':
                condition = data[i] > value;
                break;
        }
        if (index === -1 || condition) {
            value = data[i];
            index = i;
        }
    }

    return index;
}

function startTx() {
    txTimestep = getValue('#tx-timestep', 'int');
    setInterval(tx, txTimestep);
}

function startRx() {
    rxTimestep = getValue('#rx-timestep', 'int');
    setInterval(rx, rxTimestep);
}

function log() {

}

function rx() {
    var
        fftResult = new FFTResult(audioMonoIO.getFrequencyData(), audioMonoIO.getSampleRate()),
        loudestBinIndex,
        receivedIndex;

    loudestBinIndex = fftResult.getLoudestBinIndex(
        carrierFrequency - range * fftResult.getResolution(),
        carrierFrequency + range * fftResult.getResolution()
    );

    receivedIndex = loudestBinIndex - carrierFrequencyBinIndex;

    html('#log', (receivedIndex > 0 ? '+' : '') + receivedIndex + ', ', true);
}

function tx() {
    var frequency, frequencyBinIndex, sample;

    sample = parseInt(txData[txDataIndex]) % (range + 1);
    frequencyBinIndex = carrierFrequencyBinIndex + sample;
    frequency = FFTResult.getFrequency(frequencyBinIndex, audioMonoIO.getSampleRate(), fftSize);

    audioMonoIO.setPeriodicWave(frequency, 1);

    txDataIndex = (txDataIndex + 1) % txData.length;
}
*/
