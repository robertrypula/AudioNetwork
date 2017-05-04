// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_FREQUENCY_DIGIT_BEFORE_THE_DOT = 5,
    RX_FREQUENCY_DIGIT_AFTER_THE_DOT = 6,
    domRxFrequencyWidget,
    audioMonoIO,
    waveAnalyser,
    rxFrequency = 1500,
    rxBufferSize = 1000,
    rxSampleCounter = 0;

function init() {
    domRxFrequencyWidget = document.getElementById('rx-frequency-widget');

    audioMonoIO = new AudioMonoIO();
    waveAnalyser = new WaveAnalyser();
    audioMonoIO.setSampleInHandler(sampleInHandler);

    updateRxFrequencyOnScreen();
}

function rxFrequencyWidgetClick(action, digitPosition) {
    rxFrequency = changeDigitInFloat(
        action,
        digitPosition,
        rxFrequency,
        RX_FREQUENCY_DIGIT_BEFORE_THE_DOT,
        RX_FREQUENCY_DIGIT_AFTER_THE_DOT
    );
    updateRxFrequencyOnScreen();
}

function updateRxFrequencyOnScreen() {
    updateDigitInWidget(
        domRxFrequencyWidget,
        rxFrequency,
        RX_FREQUENCY_DIGIT_BEFORE_THE_DOT,
        RX_FREQUENCY_DIGIT_AFTER_THE_DOT
    );
}

// ----------------------

function sampleInHandler(monoIn) {
    var i, sample;

    for (i = 0; i < monoIn.length; i++) {
        sample = monoIn[i];
        waveAnalyser.handle(sample);
        rxSampleCounter++;

        if (rxSampleCounter % rxBufferSize === 0) {
            waveAnalyser.getFrequencyData();
        }
    }

}
