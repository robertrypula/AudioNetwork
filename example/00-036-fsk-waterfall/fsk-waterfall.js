// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_FFT_SIZE_EXPONENT = 12,
    RX_TIME_MS = 500,
    audioMonoIO,
    frequencyCalculator,
    rxSmartTimer,
    rxFftSizeExponent,
    rxTimeMs,
    rxIndexMin,
    rxIndexMax,
    rxSpectrogram;

function init() {
    audioMonoIO = new AudioMonoIO(Math.pow(2, RX_FFT_SIZE_EXPONENT));
    frequencyCalculator = new FrequencyCalculator(
        function () {
            return audioMonoIO.getSampleRate();
        },
        function () {
            return Math.pow(2, rxFftSizeExponent.getValue());
        }
    );

    document.getElementById('sample-rate').innerHTML = audioMonoIO.getSampleRate();

    initFloatWidget();

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));

    rxSmartTimer = new SmartTimer(
        rxTimeMs.getValue() / 1000
    );
    rxSmartTimer.setHandler(rxSmartTimerHandler);
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
    var hertz = frequencyCalculator.getHertzFromCyclePerWindow(rxIndexMin.getValue());

    html('#rx-index-min-frequency', hertz.toFixed(6) + ' Hz');
}

function onRxIndexMaxChange() {
    var hertz = frequencyCalculator.getHertzFromCyclePerWindow(rxIndexMax.getValue());

    html('#rx-index-max-frequency', hertz.toFixed(6) + ' Hz');
}

// ----------------------

function rxSmartTimerHandler() {
    var
        frequencyData = audioMonoIO.getFrequencyData(),
        frequencyDataInner = [],
        i;

    for (i = rxIndexMin.getValue(); i <= rxIndexMax.getValue(); i++) {
        frequencyDataInner.push(frequencyData[i]);
    }

    rxSpectrogram.add(frequencyDataInner);
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
