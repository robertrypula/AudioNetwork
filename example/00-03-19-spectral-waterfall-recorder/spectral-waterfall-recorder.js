// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE_EXPONENT = 13,
    FFT_FREQUENCY_BIN_SKIP_FACTOR = 47,
    RX_FREQUENCY_MIN = 0,
    RX_FREQUENCY_MAX = 20000,
    SAMPLE_TIME_MS = 250;

    audioMonoIO,
    rxSpectrogram,
    smartTimer,
    rxSampleCount = 0,

    fftSizeExponent,
    fftFrequencyBinSkipFactor,
    rxFrequencyMin,
    rxFrequencyMax;

function init() {
    audioMonoIO = new AudioMonoIO(Math.pow(2, FFT_SIZE_EXPONENT));

    initFloatWidget();

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    smartTimer = new SmartTimer(SAMPLE_TIME_MS / 1000);
    smartTimer.setListener(smartTimerListener);

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(document.getElementById('loopback-checkbox').checked);
    }
}

function getFftSize() {
    return Math.pow(2, fftSizeExponent.getValue());
}


function initFloatWidget() {
    fftSizeExponent = new EditableFloatWidget(
        document.getElementById('fft-size-exponent'),
        FFT_SIZE_EXPONENT, 2, 0,
        onFftSizeExponentChange
    );

    fftFrequencyBinSkipFactor = new EditableFloatWidget(
        document.getElementById('fft-frequency-bin-skip-factor'),
        FFT_FREQUENCY_BIN_SKIP_FACTOR, 2, 0,
        null
    );

    rxFrequencyMin = new EditableFloatWidget(
        document.getElementById('rx-frequency-min'),
        RX_FREQUENCY_MIN, 5, 0,
        null
    );

    rxFrequencyMax = new EditableFloatWidget(
        document.getElementById('rx-frequency-max'),
        RX_FREQUENCY_MAX, 5, 0,
        null
    );
}

// ----------------------

function onFftSizeExponentChange() {
    audioMonoIO.setFFTSize(getFftSize());
}

// ----------------------

function updateView(fftResult, rxBinMin, rxBinMax, loudestBinIndex) {
    var
        fftNominalResolution,
        fltSkippedResolution;

    fftNominalResolution = audioMonoIO.getSampleRate() / getFftSize();
    fltSkippedResolution = fftNominalResolution * fftFrequencyBinSkipFactor.getValue();

    rxSpectrogram.add(
        fftResult.getFrequencyData(),
        rxBinMin,
        rxBinMax,
        fltSkippedResolution,
        document.getElementById('loudest-marker').checked
            ? loudestBinIndex
            : Spectrogram.INDEX_MARKER_DISABLED,
        Spectrogram.ROW_MARKER_DISABLED
    );
}

function smartTimerListener() {
    var
        frequencyData,
        fftResult,
        rxBinMin,
        rxBinMax,
        loudestBinIndex;

    frequencyData = audioMonoIO.getFrequencyData();
    fftResult = new FFTResult(frequencyData, audioMonoIO.getSampleRate());
    fftResult.downconvert(fftFrequencyBinSkipFactor.getValue());
    rxBinMin = fftResult.getBinIndex(rxFrequencyMin.getValue());
    rxBinMax = fftResult.getBinIndex(rxFrequencyMax.getValue());
    loudestBinIndex = fftResult.getLoudestBinIndexInBinRange(rxBinMin, rxBinMax);

    updateView(fftResult, rxBinMin, rxBinMax, loudestBinIndex);

    rxSampleCount++;
}

