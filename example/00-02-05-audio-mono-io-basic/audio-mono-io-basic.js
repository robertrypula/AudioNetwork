// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var AudioMonoIO = AudioNetwork.Rewrite.WebAudio.AudioMonoIO;

var
    FFT_SIZE = 8 * 1024,
    BUFFER_SIZE = 8 * 1024,
    ONE_SECOND = 1000,
    ABSOLUTE_VALUE = true,
    NORMAL_VALUE = false,
    TONE_LOW = 2000,
    TONE_HIGH = 2500,
    txFrequency = TONE_LOW,
    txVolume = 0.01,
    whiteNoiseVolume = 0.05,
    whiteNoiseCheckbox,
    toneCheckbox,
    audioMonoIO,
    domGaugeRaw,
    domGaugeAnalyser,
    domFftResolution,
    domPeakFrequency,
    domFftMaxValueIndex,
    animationFrameFirstCall = true;

function init() {
    domFftResolution = document.getElementById('fft-resolution');
    domPeakFrequency = document.getElementById('peak-frequency');
    domFftMaxValueIndex = document.getElementById('fft-max-value-index');
    domGaugeRaw = document.getElementById('max-absolute-amplitude-gauge-rawsample');
    domGaugeAnalyser = document.getElementById('max-absolute-amplitude-gauge-analysernode');

    audioMonoIO = new AudioMonoIO(FFT_SIZE, BUFFER_SIZE);

    audioMonoIO.setSampleInHandler(sampleInHandler);
    audioMonoIO.setSampleOutHandler(sampleOutHandler);

    audioMonoIO.setPeriodicWave(txFrequency, txVolume);
    setInterval(intervalHandler, ONE_SECOND);

    animationFrameLoop();
}

function whiteNoiseUpdateVolume(volume) {
    whiteNoiseVolume = volume;
}

function toneUpdateVolume(volume) {
    txVolume = volume;
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

    return Math.abs(data[index]);
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
        decibelValue = freqDomain[freqDomainMaxValueIndex],
        maxAbsoluteSample = getMaxAbsoluteValue(timeDomain),
        maxAbsoluteSampleUnit = normalizeToUnit(maxAbsoluteSample);

    domFftResolution.innerHTML = audioMonoIO.getFFTResolution().toFixed(2) + ' Hz';
    domFftMaxValueIndex.innerHTML = freqDomainMaxValueIndex;
    domPeakFrequency.innerHTML = frequencyPeak.toFixed(2) + ' Hz (' + decibelValue.toFixed(1) + ' dB)';
    domGaugeAnalyser.style.width = (maxAbsoluteSampleUnit * 100) + '%';
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
        monoOut[i] = whiteNoiseVolume * (Math.random() * 2 - 1);    // white noise
    }
}

function intervalHandler() {
    txFrequency = (txFrequency === TONE_LOW ? TONE_HIGH : TONE_LOW);
    audioMonoIO.setPeriodicWave(txFrequency, txVolume);
}
