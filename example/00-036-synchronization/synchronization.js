// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE = 4 * 1024,
    SKIP_FACTOR = 5,

    SYMBOL_MIN = 93,
    SYMBOL_MAX = 117,
    SYMBOL_SYNC_A = 108,
    SYMBOL_SYNC_B = 109,

    RX_TIME_MS = 500,
    TX_FACTOR = 2,
    TX_TIME_MS = RX_TIME_MS * TX_FACTOR,
    TX_SAMPLE_RATE = 48000,
    TX_AMPLITUDE = 0.01,

    audioMonoIO,
    correlator,
    rxSpectrogram,
    rxConnectLog = [],
    rxConnectDetectedPrevious = false,
    rxConnectDetected = false,
    rxSampleCount = 0,

    rxSmartTimer,
    txSmartTimer,

    txSampleRate,
    txSymbol,
    txSymbolQueue = [];

function init() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE);
    correlator = new Correlator(TX_FACTOR);
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

function txConnect(sampleRate) {
    var i, codeValue;

    txSampleRate.setValue(sampleRate);
    for (i = 0; i < correlator.getCodeLength(); i++) {
        codeValue = correlator.getCodeValue(i);
        txSymbolQueue.push(
            codeValue === -1 ? SYMBOL_SYNC_A : SYMBOL_SYNC_B
        );
    }
    refreshSymbolQueue();
}

function txSymbol(symbol) {
    txSymbolQueue.push(symbol);
    refreshSymbolQueue();
}

function handleNewDeviceConnection() {
    var i, j, stats, averageDecibel, htmlLog;

    stats = [];
    for (i = 0; i < TX_FACTOR; i++) {
        if (rxConnectLog[i] && rxConnectLog[i].getSize() > 3) {
            averageDecibel = 0;
            for (j = 0; j < rxConnectLog[i].getSize(); j++) {
                averageDecibel += rxConnectLog[i].getItem(j);
            }
            averageDecibel /= rxConnectLog[i].getSize();
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

function tryToDetectConnectSignal(rxSampleCount, loudestBinIndex, loudestBinDecibel) {
    var correlationDataLogicValue, offset, rank;

    switch (loudestBinIndex) {
        case SYMBOL_SYNC_A: correlationDataLogicValue = false; break;
        case SYMBOL_SYNC_B: correlationDataLogicValue = true; break;
        default: correlationDataLogicValue = null;
    }
    correlator.handle(correlationDataLogicValue, loudestBinDecibel);
    rank = correlator.getCorrelationRank();
    rxConnectDetected = (
        rank === Correlator.CORRELATION_RANK_NEGATIVE_HIGH ||
        rank === Correlator.CORRELATION_RANK_POSITIVE_HIGH
    );
    if (rxConnectDetected) {
        offset = rxSampleCount % TX_FACTOR;
        if (!rxConnectLog[offset]) {
            rxConnectLog[offset] = new Buffer(50);
        }
        rxConnectLog[offset].pushEvenIfFull(correlator.getDecibelAverage());
    }

    if (rxConnectDetectedPrevious && !rxConnectDetected) {
        handleNewDeviceConnection();
    }

    rxConnectDetectedPrevious = rxConnectDetected;

    html(
        '#rx-log-connect-correlation',
        rxConnectDetected
            ? 'Connecting new device... (correlation ' + correlator.getCorrelationValue() + '/' + correlator.getCodeLength() + ')'
            : '-'
    );
}

// ----------------------

function rxSmartTimerHandler() {
    var
        frequencyData,
        fftResult,
        loudestBinIndex,
        loudestBinDecibel,
        noiseAverageDecibel,
        frequencyDataInner = [],
        i;

    if (!document.getElementById('rx-active').checked) {
        return;
    }

    frequencyData = audioMonoIO.getFrequencyData();
    fftResult = new FFTResult(frequencyData, audioMonoIO.getSampleRate());
    fftResult.downconvertScalar(SKIP_FACTOR);
    loudestBinIndex = fftResult.getLoudestBinIndexInBinRange(SYMBOL_MIN, SYMBOL_MAX);
    loudestBinDecibel = fftResult.getDecibel(loudestBinIndex);

    noiseAverageDecibel = 0;
    for (i = SYMBOL_MIN; i <= SYMBOL_MAX; i++) {
        frequencyDataInner.push(fftResult.getDecibel(i));
        noiseAverageDecibel += fftResult.getDecibel(i);
    }
    noiseAverageDecibel -= loudestBinDecibel;
    noiseAverageDecibel /= frequencyDataInner.length - 1;

    rxSpectrogram.add(
        frequencyDataInner,
        document.getElementById('loudest-marker').checked
            ? loudestBinIndex - SYMBOL_MIN
            : -1,
        SYMBOL_MIN,
        1,
        rxSampleCount % TX_FACTOR === 0
    );

    tryToDetectConnectSignal(rxSampleCount, loudestBinIndex, loudestBinDecibel);

    html(
        '#rx-symbol',
        loudestBinIndex +
        ' (' + fftResult.getFrequency(loudestBinIndex).toFixed(2) + ' Hz, ' +
        loudestBinDecibel.toFixed(2) + ' dB)'
    );
    html(
        '#rx-log',
        'min&nbsp;&nbsp; : ' + SYMBOL_MIN + ' (' + fftResult.getFrequency(SYMBOL_MIN).toFixed(2) + ' Hz)<br/>' +
        'max&nbsp;&nbsp; : ' + SYMBOL_MAX + ' (' + fftResult.getFrequency(SYMBOL_MAX).toFixed(2) + ' Hz)<br/>' +
        'range : ' + (SYMBOL_MAX - SYMBOL_MIN + 1) + '<br/>'
    );

    rxSampleCount++;
}

function txSmartTimerHandler() {
    var symbol = txSymbolQueue.shift();

    setTxSound(symbol);
    refreshSymbolQueue();
}
