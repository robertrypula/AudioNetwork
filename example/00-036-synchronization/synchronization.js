// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE = 4 * 1024,
    BASE_TIME_MS = 500,
    SKIP_FACTOR = 5,

    SYMBOL_MIN = 93,
    SYMBOL_MAX = 117,
    SYMBOL_SYNC_A = 108,
    SYMBOL_SYNC_B = 109,

    RX_SKIP_FACTOR = 4,
    RX_TIME_MS = BASE_TIME_MS,
    TX_SKIP_FACTOR = 2,
    TX_TIME_MS = BASE_TIME_MS * TX_SKIP_FACTOR,
    TX_SAMPLE_RATE = 48000,
    TX_AMPLITUDE = 0.01,

    audioMonoIO,
    correlator,
    rxSpectrogram,
    rxConnectSignal = [],
    rxSampleCount = 0,

    rxSmartTimer,
    txSmartTimer,

    txSampleRate,
    txSymbol,
    txSymbolQueue = [];

function init() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE);
    correlator = new Correlator(RX_SKIP_FACTOR);
    document.getElementById('rx-sample-rate').innerHTML = audioMonoIO.getSampleRate();

    initFloatWidget();

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    rxSmartTimer = new SmartTimer(RX_TIME_MS / 1000);
    rxSmartTimer.setHandler(rxSmartTimerHandler);

    setTimeout(function () {
        txSmartTimer = new SmartTimer(TX_TIME_MS / 1000);
        txSmartTimer.setHandler(txSmartTimerHandler);
    }, 250);

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(document.getElementById('loopback-checkbox').checked);
    }
}

function initFloatWidget() {
    txSampleRate = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        TX_SAMPLE_RATE, 5, 0,
        null
    );
}

function setTxSound(symbol) {
    var frequency;

    if (!symbol) {
        audioMonoIO.setPeriodicWave(0);
        return;
    }

    frequency = SKIP_FACTOR * symbol * txSampleRate.getValue() / FFT_SIZE;
    audioMonoIO.setPeriodicWave(frequency, TX_AMPLITUDE);
}

function refreshSymbolQueue() {
    html('#tx-symbol-queue', txSymbolQueue.join(', '));
}

// ----------------------

function addToTxQueue(symbol) {
    txSymbolQueue.push(symbol);
    txSymbolQueue.push(null);   // TODO remove that in the future
}

function txConnect(sampleRate) {
    var i, codeValue;

    txSampleRate.setValue(sampleRate);
    for (i = 0; i < correlator.getCodeLength(); i++) {
        codeValue = correlator.getCodeValue(i);
        addToTxQueue(
            codeValue === -1 ? SYMBOL_SYNC_A : SYMBOL_SYNC_B
        );
    }
    refreshSymbolQueue();
}

function txSymbol(symbol) {
    addToTxQueue(symbol);
    refreshSymbolQueue();
}

function tryToConnectNewDevice() {
    var i, j, stats, averageDecibel, htmlLog;

    stats = [];
    for (i = 0; i < RX_SKIP_FACTOR; i++) {
        if (rxConnectSignal[i] && rxConnectSignal[i].getSize() > 3) {
            averageDecibel = 0;
            for (j = 0; j < rxConnectSignal[i].getSize(); j++) {
                averageDecibel += rxConnectSignal[i].getItem(j);
            }
            averageDecibel /= rxConnectSignal[i].getSize();
            stats.push({
                offset: i,
                averageDecibel: averageDecibel
            });
        }
    }

    htmlLog = '';
    for (i = 0; i < stats.length; i++) {
        htmlLog += stats[i].offset + ' ' + stats[i].averageDecibel.toFixed(2) + ' dB<br/>';
    }
    html('#rx-log-connect-offset', htmlLog);
    console.log(stats);
}

function tryToDetectConnectSignal(rxSampleCount, symbol, signalDecibel) {
    var dataLogicValue, offset, connectSignalPresent, bigEnoughBufferSize;

    bigEnoughBufferSize = 100 * correlator.getCodeLength();

    switch (symbol) {
        case SYMBOL_SYNC_A: dataLogicValue = false; break;
        case SYMBOL_SYNC_B: dataLogicValue = true; break;
        default: dataLogicValue = null;
    }
    correlator.handle(dataLogicValue, signalDecibel);
    connectSignalPresent = correlator.isCorrelatedHigh();
    if (connectSignalPresent) {
        offset = rxSampleCount % RX_SKIP_FACTOR;
        if (!rxConnectSignal[offset]) {
            rxConnectSignal[offset] = {
                offset: offset,
                signalDecibelBuffer: new Buffer(bigEnoughBufferSize),
                noiseDecibelBuffer: new Buffer(bigEnoughBufferSize),
                signalToNoiseRatioBuffer: new Buffer(bigEnoughBufferSize)
            };
        }
        rxConnectSignal[offset].offset = offset;
        rxConnectSignal[offset].signalDecibelBuffer.pushEvenIfFull(correlator.getSignalDecibelAverage());
        rxConnectSignal[offset].noiseDecibelBuffer.pushEvenIfFull(correlator.getNoiseDecibelAverage());
        rxConnectSignal[offset].signalToNoiseRatioBuffer.pushEvenIfFull(correlator.getSignalToNoiseRatio());
    }

    /*
    connectSignalJustLost = rxConnectSignalPresentPrevious && !rxConnectSignalPresent;
    if (connectSignalJustLost) {
        //tryToConnectNewDevice();
        rxConnectSignal.length = 0;    // reset
    }

    rxConnectSignalPresentPrevious = rxConnectSignalPresent;
    */

    html(
        '#rx-log-connect-correlation',
        'correlation ' + correlator.getCorrelationValue() + '/' + correlator.getCodeLength()
    );
}

// ----------------------

function rxSmartTimerHandler() {
    var
        frequencyData,
        fftResult,
        symbol,
        signalDecibel,
        noiseDecibelSum,
        noiseDecibel,
        signalToNoiseRatio,
        frequencyDataInner = [],
        i;

    if (!document.getElementById('rx-active').checked) {
        return;
    }

    frequencyData = audioMonoIO.getFrequencyData();
    fftResult = new FFTResult(frequencyData, audioMonoIO.getSampleRate());
    fftResult.downconvertScalar(SKIP_FACTOR);
    symbol = fftResult.getLoudestBinIndexInBinRange(SYMBOL_MIN, SYMBOL_MAX);
    signalDecibel = fftResult.getDecibel(symbol);

    noiseDecibelSum = 0;
    for (i = SYMBOL_MIN; i <= SYMBOL_MAX; i++) {
        frequencyDataInner.push(fftResult.getDecibel(i));
        if (i !== symbol) {
            noiseDecibelSum += fftResult.getDecibel(i);
        }
    }
    noiseDecibel = null;
    if (frequencyDataInner.length > 1) {
        noiseDecibel = noiseDecibelSum / (frequencyDataInner.length - 1);
    }
    signalToNoiseRatio = signalDecibel - noiseDecibel;

    rxSpectrogram.add(
        frequencyDataInner,
        document.getElementById('loudest-marker').checked
            ? symbol - SYMBOL_MIN
            : -1,
        SYMBOL_MIN,
        1,
        rxSampleCount % RX_SKIP_FACTOR === 0
    );

    tryToDetectConnectSignal(rxSampleCount, symbol, signalDecibel);

    html('#rx-symbol', symbol);
    html(
        '#rx-symbol-detail',
        fftResult.getFrequency(symbol).toFixed(2) + ' Hz, ' +
        signalDecibel.toFixed(2) + ' dB, ' +
        'signalToNoiseFloorDistance: ' + signalToNoiseRatio + ' dB'
    );
    html(
        '#rx-log',
        'min: ' + SYMBOL_MIN + ' (' + fftResult.getFrequency(SYMBOL_MIN).toFixed(2) + ' Hz)<br/>' +
        'max: ' + SYMBOL_MAX + ' (' + fftResult.getFrequency(SYMBOL_MAX).toFixed(2) + ' Hz)<br/>' +
        'range: ' + (SYMBOL_MAX - SYMBOL_MIN + 1) + '<br/>'
    );

    rxSampleCount++;
}

function txSmartTimerHandler() {
    var symbol = txSymbolQueue.shift();

    setTxSound(symbol);
    refreshSymbolQueue();
}
