// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE = 4 * 1024,
    BUFFER_SIZE = 4 * 1024,
    ONE_SECOND = 1000,
    ABSOLUTE_VALUE = true,
    NORMAL_VALUE = false,
    audioMonoIO,
    domGaugeRaw,
    domGaugeAnalyser,
    domPeakFrequency,
    txFrequency,
    animationFrameFirstCall = true;

function init() {
    txFrequency = 2000;

    domPeakFrequency = document.getElementById('peak-frequency');
    domGaugeRaw = document.getElementById('max-absolute-amplitude-gauge-rawsample');
    domGaugeAnalyser = document.getElementById('max-absolute-amplitude-gauge-analysernode');

    audioMonoIO = new AudioMonoIO(FFT_SIZE, BUFFER_SIZE);

    audioMonoIO.setSampleInHandler(sampleInHandler);
    audioMonoIO.setSampleOutHandler(sampleOutHandler);

    audioMonoIO.setPeriodicWave(txFrequency, 0.01);
    setInterval(intervalHandler, ONE_SECOND);

    animationFrameLoop();
}

// -----------------------------------------------------------------------
// utils

function animationFrameLoop() {
    if (!animationFrameFirstCall) {
        nextAnimationFrame();
    } else {
        animationFrameFirstCall = false;
    }
    requestAnimationFrame(animationFrameLoop);
}

function getMaxAbsoluteValue(data) {
    var index = getIndexOfMax(data, ABSOLUTE_VALUE);

    return data[index];
}

function getMaxValue(data) {
    var index = getIndexOfMax(data, NORMAL_VALUE);

    return data[index];
}

function getIndexOfMax(data, absoluteValue) {
    var i, maxIndex, max, value;

    for (i = 0; i < data.length; i++) {
        value = absoluteValue ? Math.abs(data[i]) : data[i];
        if (i === 0 || value > max) {
            max = value;
            maxIndex = i;
        }
    }

    return maxIndex;
}

function normalizeToUnit(value) {
    value = value > 1 ? 1 : value;
    value = value < 0 ? 0 : value;

    return value;
}

// -----------------------------------------------------------------------

function nextAnimationFrame() {
    var
        timeDomain = audioMonoIO.getTimeDomainData(),
        freqDomain = audioMonoIO.getFrequencyData(),
        freqDomainMaxValueIndex = getIndexOfMax(freqDomain, NORMAL_VALUE),
        frequencyPeak = freqDomainMaxValueIndex * audioMonoIO.getFFTResolution(),
        maxAbsoluteSample = getMaxAbsoluteValue(timeDomain),
        maxAbsoluteSampleUnit = normalizeToUnit(maxAbsoluteSample);

    domGaugeAnalyser.style.width = (maxAbsoluteSampleUnit * 100) + '%';
    domPeakFrequency.innerHTML = frequencyPeak.toFixed(2) + ' Hz';
}

function sampleInHandler(monoIn) {
    var
        maxAbsoluteSample = getMaxAbsoluteValue(monoIn),
        maxAbsoluteSampleUnit = normalizeToUnit(maxAbsoluteSample);

    domGaugeRaw.style.width = (maxAbsoluteSampleUnit * 100) + '%';
}

function sampleOutHandler(monoOut, monoIn) {
    var i;

    for (i = 0; i < monoOut.length; i++) {
        monoOut[i] = 0.05 * (Math.random() * 2 - 1);    // white noise
    }
}

function intervalHandler() {
    txFrequency = (txFrequency === 2000 ? 2500 : 2000);
    audioMonoIO.setPeriodicWave(txFrequency, 0.01);
}
