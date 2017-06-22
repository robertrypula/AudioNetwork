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
    txSymbolQueue.push(null);   // TODO remove that in the future
    txSymbolQueue.push(symbol);
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

function sortConnectionData(data) {
    data.sort(function (a, b) {
        return 0 ||
            a.correlationValue < b.correlationValue ? 1 : a.correlationValue > b.correlationValue ? -1 : 0 ||
            a.signalToNoiseRatio < b.signalToNoiseRatio ? 1 : a.signalToNoiseRatio > b.signalToNoiseRatio ? -1 : 0;
    });
}

function tryToConnectNewDevice() {
    var i, decisionList, deviceInfo;

    decisionList = [];
    for (i = 0; i < RX_SKIP_FACTOR; i++) {
        if (rxConnectSignal[i] && rxConnectSignal[i].detail.length > 1) {
            sortConnectionData(rxConnectSignal[i].detail);
            decisionList.push({
                offset: rxConnectSignal[i].offset,
                correlationValue: rxConnectSignal[i].detail[0].correlationValue,
                signalDecibel: rxConnectSignal[i].detail[0].signalDecibel,
                noiseDecibel: rxConnectSignal[i].detail[0].noiseDecibel,
                signalToNoiseRatio: rxConnectSignal[i].detail[0].signalToNoiseRatio
            });
        }
    }
    sortConnectionData(decisionList);
    deviceInfo = decisionList[0];

    html(
        '#rx-log-connect-offset',
        'Device connected!<br/>' +
        '- offset ' + deviceInfo.offset + '<br/>' +
        '- SNR ' + deviceInfo.signalToNoiseRatio.toFixed(2) + ' dB' + '<br/>' +
        '- cv ' + deviceInfo.correlationValue

        // offset: 2, correlationValue: 18, signalDecibel: -53.55561235215929, noiseDecibel: -219.78040854136145, signalToNoiseRatio: 166.22479618920215}
    );
}

function tryToDetectConnectSignal(rxSampleCount, symbol, signalDecibel, noiseDecibel) {
    var dataLogicValue, offset, connectSignalDetected, fullSkipBlockAvailable, i, connectSignalDetectedInSkipBlock;

    offset = rxSampleCount % RX_SKIP_FACTOR;
    fullSkipBlockAvailable = offset === 0 && rxSampleCount !== 0;
    if (fullSkipBlockAvailable) {
        for (i = 0; i < rxConnectSignal.length; i++) {
            if (rxConnectSignal[i].justLost) {
                tryToConnectNewDevice();
                rxConnectSignal.length = 0;        // TODO bad reset, refactor
                break;
            }
        }
    }

    connectSignalDetectedInSkipBlock = false;
    for (i = 0; i < rxConnectSignal.length; i++) {
        if (rxConnectSignal[i].detectedPrevious) {
            connectSignalDetectedInSkipBlock = true;
            break;
        }
    }

    switch (symbol) {
        case SYMBOL_SYNC_A: dataLogicValue = false; break;
        case SYMBOL_SYNC_B: dataLogicValue = true; break;
        default: dataLogicValue = null;
    }
    correlator.handle(dataLogicValue, signalDecibel, noiseDecibel);
    connectSignalDetected = correlator.isCorrelatedHigh();

    if (!rxConnectSignal[offset]) {
        rxConnectSignal[offset] = {
            offset: offset,
            detail: [],
            justLost: undefined,
            detectedPrevious: undefined
        };
    }

    if (connectSignalDetected) {
        rxConnectSignal[offset].detail.push({
            correlationValue: Math.abs(correlator.getCorrelationValue()),
            signalDecibel: correlator.getSignalDecibelAverage(),
            noiseDecibel: correlator.getNoiseDecibelAverage(),
            signalToNoiseRatio: correlator.getSignalToNoiseRatio()
        });
    }
    rxConnectSignal[offset].justLost = rxConnectSignal[offset].detectedPrevious === true && !connectSignalDetected;
    rxConnectSignal[offset].detectedPrevious = connectSignalDetected;

    html(
        '#rx-log-connect-correlation',
        (connectSignalDetectedInSkipBlock ? 'Connecting new device...' : '-')
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

    rxSpectrogram.add(
        frequencyDataInner,
        document.getElementById('loudest-marker').checked
            ? symbol - SYMBOL_MIN
            : -1,
        SYMBOL_MIN,
        1,
        rxSampleCount % RX_SKIP_FACTOR === 0
    );

    tryToDetectConnectSignal(rxSampleCount, symbol, signalDecibel, noiseDecibel);

    html('#rx-symbol', symbol);
    html(
        '#rx-symbol-detail',
        fftResult.getFrequency(symbol).toFixed(2) + ' Hz, ' +
        signalDecibel.toFixed(2) + ' dB'
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
