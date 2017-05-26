// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_RESOLUTION_EXPONENT = 2,
    RX_FFT_SIZE = 4 * 1024,
    TX_FFT_SIZE = RX_FFT_SIZE / Math.pow(2, RX_RESOLUTION_EXPONENT),
    RX_TIME_MS = 0.1,
    RX_SAMPLE_FACTOR = 2,
    TX_TIME_MS = RX_TIME_MS * RX_SAMPLE_FACTOR,
    TX_SAMPLE_RATE = 48000,
    TX_AMPLITUDE = 0.25,
    FREQUENCY_BAND_START = 3000,
    rxBinIndexA,
    rxBinIndexB,
    audioMonoIO,
    rxSmartTimer,
    txSampleRate,
    txSmartTimer,
    barkerCode,
    realBitPrevious = null;

function init() {
    audioMonoIO = new AudioMonoIO(RX_FFT_SIZE);
    barkerCode = new BarkerCode(RX_SAMPLE_FACTOR);

    rxBinIndexA = FFTResult.getBinIndex(
        FREQUENCY_BAND_START,
        audioMonoIO.getSampleRate(),
        TX_FFT_SIZE // TX is fine here because we are down-converting rx decibel array before indexing
    );
    rxBinIndexB = rxBinIndexA + 1;

    document.getElementById('rx-sample-rate').innerHTML = audioMonoIO.getSampleRate();

    initFloatWidget();

    rxSmartTimer = new SmartTimer(RX_TIME_MS);
    rxSmartTimer.setHandler(rxSmartTimerHandler);

    txSmartTimer = new SmartTimer(TX_TIME_MS);
    txSmartTimer.setHandler(txSmartTimerHandler);

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(document.getElementById('loopback-checkbox').checked);
    }
}

function setTxSound(indexToTransmit) {
    var frequency;

    frequency = indexToTransmit * txSampleRate.getValue() / TX_FFT_SIZE;
    audioMonoIO.setPeriodicWave(frequency, TX_AMPLITUDE);
}

function initFloatWidget() {
    txSampleRate = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        TX_SAMPLE_RATE, 5, 0,
        null
    );
}

// ----------------------

function onTxAddToQueueNearTextarea() {
    var
        contentRaw = document.getElementById('tx-symbol-edit').value,
        content = contentRaw.trim().replace(/ +(?= )/g, ''),
        symbolList = content.split(' '),
        htmlString,
        i;

    for (i = 0; i < symbolList.length; i++) {
        htmlString = '<div>' + parseInt(symbolList[i]) + '</div>';
        html('#tx-symbol-queue', htmlString, true);
    }
}

// ----------------------

function rxSmartTimerHandler() {
    var
        frequencyData = audioMonoIO.getFrequencyData(),
        fftResult = new FFTResult(frequencyData, audioMonoIO.getSampleRate()),
        htmlString,
        decibelA,
        decibelB,
        correlationValue,
        highlightClass,
        isOne,
        realBit;

    fftResult.downconvert(RX_RESOLUTION_EXPONENT);
    decibelA = fftResult.getDecibel(rxBinIndexA);
    decibelB = fftResult.getDecibel(rxBinIndexB);

    isOne = decibelA < decibelB;

    barkerCode.handle(isOne);
    correlationValue = barkerCode.getCorrelationValue();

    realBit = null;
    switch (barkerCode.getCorrelationRank()) {
        case BarkerCode.CORRELATION_RANK_POSITIVE_HIGH:
            highlightClass = 'highlight-positive-hot';
            realBit = 1;
            break;
        case BarkerCode.CORRELATION_RANK_POSITIVE:
            highlightClass = 'highlight-positive';
            break;
        case BarkerCode.CORRELATION_RANK_NEGATIVE:
            highlightClass = 'highlight-negative';
            break;
        case BarkerCode.CORRELATION_RANK_NEGATIVE_HIGH:
            highlightClass = 'highlight-negative-hot';
            realBit = 0;
            break;
        default:
            highlightClass = '';
    }

    if (document.getElementById('rx-symbol-log-checkbox').checked) {
        htmlString = '<div class="' + highlightClass + '">' +
            (isOne ? '1' : '0') + ',' + correlationValue +
            '</div>';
        html('#rx-symbol-log', htmlString, true);
    }

    if (realBit !== null && realBit !== realBitPrevious) {
        htmlString = '<div>' + realBit + '</div>';
        html('#rx-packet-log', htmlString, true);
    }
    realBitPrevious = realBit;
}

function txSmartTimerHandler() {
    var
        firstNode = select('#tx-symbol-queue > div:first-child'),
        binIndexA,
        binIndexB,
        symbol;

    binIndexA = FFTResult.getBinIndex(
        FREQUENCY_BAND_START,
        txSampleRate.getValue(),
        TX_FFT_SIZE
    );
    binIndexB = binIndexA + 1;

    if (firstNode.length > 0) {
        symbol = firstNode[0].innerHTML === '0'
            ? binIndexA
            : binIndexB;
        firstNode[0].parentNode.removeChild(firstNode[0]);
    } else {
        symbol = 0;
    }

    setTxSound(symbol);
}
