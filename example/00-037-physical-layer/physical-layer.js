// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_RESOLUTION_EXPONENT = 2,
    RX_FFT_SIZE = 4 * 1024,
    TX_FFT_SIZE = RX_FFT_SIZE / Math.pow(2, RX_RESOLUTION_EXPONENT),
    RX_TIME_MS = 0.1,
    RX_SAMPLE_FACTOR = 2,
    TX_TIME_MS = RX_TIME_MS * RX_SAMPLE_FACTOR,
    TX_AMPLITUDE = 0.25,
    audioMonoIO,
    rxSmartTimer,
    txSampleRate,
    txSmartTimer,
    barkerCode,
    realBitPrevious = null;

function init() {
    audioMonoIO = new AudioMonoIO(RX_FFT_SIZE);
    barkerCode = new BarkerCode(RX_SAMPLE_FACTOR);

    rxSmartTimer = new SmartTimer(RX_TIME_MS);
    rxSmartTimer.setHandler(rxSmartTimerHandler);

    txSmartTimer = new SmartTimer(TX_TIME_MS);
    txSmartTimer.setHandler(txSmartTimerHandler);
}

/*
function setTxSound(indexToTransmit) {
    var frequency;

    frequency = indexToTransmit * txSampleRate.getValue() / TX_FFT_SIZE;
    audioMonoIO.setPeriodicWave(frequency, TX_AMPLITUDE);
}
*/

// ----------------------

function rxSmartTimerHandler() {
    var
        frequencyData = audioMonoIO.getFrequencyData(),
        fftResult = new FFTResult(frequencyData, audioMonoIO.getSampleRate());

    fftResult.downconvert(RX_RESOLUTION_EXPONENT);

    // barkerCode.handle(isOne);
    // correlationValue = barkerCode.getCorrelationValue();
}

function txSmartTimerHandler() {
    // setTxSound(symbol);
}
