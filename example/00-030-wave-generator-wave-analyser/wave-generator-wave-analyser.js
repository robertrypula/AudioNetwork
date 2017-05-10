// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    DIGIT_BEFORE_THE_DOT = 5,
    DIGIT_AFTER_THE_DOT = 6,
    domRxFrequencyWidget,
    domLoopbackCheckbox,
    audioMonoIO,
    waveAnalyser,
    waveGenerate,
    rxFrequency = 1500,
    rxWindowSize = 4410,
    rxSampleCounter = 0;

function init() {
    var i, sample, sample2, SIZE = 16, omega, samplePerPeriod = SIZE / 3,
    phase,
    amplitude = 1,
    unitPhase = 0.25;

    waveGenerate = new WaveGenerate(samplePerPeriod);
    waveGenerate.setAmplitude(amplitude);
    waveGenerate.setUnitPhase(unitPhase);

    waveAnalyser = new WaveAnalyser(samplePerPeriod, SIZE, false);
    omega = 2 * Math.PI / samplePerPeriod;
    phase = 2 * Math.PI * unitPhase;
    for (i = 0; i < SIZE; i++) {
        sample = amplitude * Math.sin(omega * i - phase);

        sample2 = waveGenerate.getSample();
        waveGenerate.nextSample();

        console.log(i, sample.toFixed(6), sample2.toFixed(6));
        waveAnalyser.handle(sample);
    }

    console.log(waveAnalyser.getFrequencyBin());
    console.log(waveAnalyser.getDecibel().toFixed(3) + ' dB');
    console.log(waveAnalyser.getAmplitude().toFixed(3));
    console.log(waveAnalyser.getUnitPhase().toFixed(3));
    console.log(waveAnalyser);

    return;

    domRxFrequencyWidget = document.getElementById('rx-frequency-widget');
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');

    audioMonoIO = new AudioMonoIO();
    waveAnalyser = new WaveAnalyser(
        getSamplePerPeriod(audioMonoIO.getSampleRate(), rxFrequency),
        rxWindowSize,
        true
    );
    waveGenerate = new WaveGenerate(
        getSamplePerPeriod(audioMonoIO.getSampleRate(), rxFrequency)
    );
    audioMonoIO.setSampleInHandler(sampleInHandler);
    audioMonoIO.setSampleOutHandler(sampleOutHandler);
    onLoopbackCheckboxChange();
    updateRxFrequencyOnScreen();
}

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
    }
}

// ------------------------------------------------------------------------

function rxFrequencyWidgetClick(action, digitPosition) {
    rxFrequency = changeDigitInFloat(
        action,
        digitPosition,
        rxFrequency,
        DIGIT_BEFORE_THE_DOT,
        DIGIT_AFTER_THE_DOT
    );
    waveAnalyser.setSamplePerPeriod(
        getSamplePerPeriod(audioMonoIO.getSampleRate(), rxFrequency)
    );
    updateRxFrequencyOnScreen();
}

function updateRxFrequencyOnScreen() {
    updateDigitInWidget(
        domRxFrequencyWidget,
        rxFrequency,
        DIGIT_BEFORE_THE_DOT,
        DIGIT_AFTER_THE_DOT
    );
}

// -----------------------------------------------------------------------

function getSamplePerPeriod(samplePerOneCycle, cycle) {
    return samplePerOneCycle / cycle;
}

function sampleOutHandler(monoOut) {
    var i, sample;

    for (i = 0; i < monoOut.length; i++) {
        sample = waveGenerate.getSample();
        waveGenerate.nextSample();

        monoOut[i] = sample;
    }
}

function sampleInHandler(monoIn) {
    var i, sample;

    // waveAnalyser.setWindowFunction();
    for (i = 0; i < monoIn.length; i++) {
        sample = monoIn[i];
        waveAnalyser.handle(sample);
        rxSampleCounter++;

        if (rxSampleCounter % rxWindowSize === 0) {
            var log =
                'Omega: ' + waveAnalyser.$$omega.toFixed(9) + '<br/>' +
                'Amplitude: ' + waveAnalyser.getAmplitude().toFixed(12) + '<br/>' +
                'Phase: ' + waveAnalyser.getUnitPhase().toFixed(3) + '<br/>' +
                'Decibel: ' + waveAnalyser.getDecibel().toFixed(3);

            document.getElementById('log').innerHTML = log;
        }
    }

}
