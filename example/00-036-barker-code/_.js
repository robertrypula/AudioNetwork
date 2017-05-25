// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_RESOLUTION_VALUE = 4,
    RX_FFT_SIZE = 8192,
    TX_FFT_SIZE = RX_FFT_SIZE / RX_RESOLUTION_VALUE,
    RX_TIME_MS = 1.0,
    TX_TIME_MS = RX_TIME_MS * 2,
    TX_SAMPLE_RATE = 48000,
    TX_AMPLITUDE = 0.05,
    BIN_INDEX_A = 70,
    BIN_INDEX_B = 71,
    audioMonoIO,
    rxSmartTimer,
    txSampleRate,
    txSmartTimer,
    barkerCode;

function init() {
    audioMonoIO = new AudioMonoIO(RX_FFT_SIZE);
    barkerCode = new BarkerCode();

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
        isOne;

    fftResult.downconvert(2);
    decibelA = frequencyData[BIN_INDEX_A];
    decibelB = frequencyData[BIN_INDEX_B];

    /*

     0    1     2    3     4
     0    0.25  0.5  0.75  1.00

     100  101   102  103  104   124    125   126    127
      25 25.25  25.5 25.75 26   31    31.25  31.50  31.75
                       ---------------------  ||||||||||||||||||||||||
                           ^                         ^
    */

    isOne = decibelA < decibelB;

    barkerCode.handle(isOne);

    correlationValue = barkerCode.getCorrelationValue();

    htmlString = '<div>' + (isOne ? '1' : '0') + ' (' + correlationValue + ')</div>';
    html('#rx-symbol-log', htmlString, true);
}

function txSmartTimerHandler() {
    var
        firstNode = select('#tx-symbol-queue > div:first-child'),
        symbol;

    if (firstNode.length > 0){
        symbol = firstNode[0].innerHTML === '0'
            ? BIN_INDEX_A
            : BIN_INDEX_B;
        firstNode[0].parentNode.removeChild(firstNode[0]);
    } else {
        symbol = 0;
    }

    setTxSound(symbol);
}
