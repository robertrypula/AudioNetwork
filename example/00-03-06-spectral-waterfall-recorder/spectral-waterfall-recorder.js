// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE_EXPONENT = 13,
    FFT_FREQUENCY_BIN_SKIP_FACTOR = 47,
    RX_FREQUENCY_MIN = 0,
    RX_FREQUENCY_MAX = 20000,
    SAMPLE_TIME_MS = 250,
    ROW_LIMIT = 2000,

    audioMonoIO,
    rxSpectrogram,
    rxSpectrogramRecorded,
    smartTimer,
    rxSampleCount = 0,

    fftSizeExponent,
    fftFrequencyBinSkipFactor,
    rxFrequencyMin,
    rxFrequencyMax,
    isRecording = false,
    recordedData = {};

function init() {
    audioMonoIO = new AudioMonoIO(Math.pow(2, FFT_SIZE_EXPONENT));

    initFloatWidget();

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    rxSpectrogramRecorded = new Spectrogram(document.getElementById('rx-spectrogram-recorded'), ROW_LIMIT);
    smartTimer = new SmartTimer(SAMPLE_TIME_MS / 1000);
    smartTimer.setListener(smartTimerListener);
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

function onRecordStartClick() {
    isRecording = true;
    html('#recording-status', 'Recording...');
}

function onRecordStopClick() {
    var recordedDataString, i, j, array;

    isRecording = false;
    for (i = 0; i < recordedData.history.length; i++) {
        array = [];
        for (j = 0; j < recordedData.history[i].frequencyData.length; j++) {
            array.push(parseFloat(recordedData.history[i].frequencyData[j].toFixed(1)));
        }
        recordedData.history[i].frequencyData = array;
    }
    recordedDataString = JSON.stringify(recordedData);
    recordedData = {};

    html('#recording-status', 'Recording stopped');
    setTimeout(function () {
        document.getElementById('recorded-data').value = recordedDataString;
    }, 0)
}

function onDrawClick() {
    var
        drawDataString = getFormFieldValue('#recorded-data'),
        drawData,
        drawDataRow,
        i;

    drawData = JSON.parse(drawDataString);
    rxSpectrogramRecorded.clear();
    for (i = 0; i < drawData.history.length; i++) {
        drawDataRow = drawData.history[i];
        if (i === 0) {
            html('#recorded-data-rendered-frequency-bin', drawData.indexMax - drawData.indexMin + 1);
        }
        rxSpectrogramRecorded.add(
            drawDataRow.frequencyData,
            drawData.indexMin,
            drawData.indexMax,
            drawData.frequencySpacing,
            document.getElementById('recorded-loudest-marker').checked
                ? drawDataRow.indexMarker
                : Spectrogram.INDEX_MARKER_DISABLED,
            drawDataRow.rowMarker
                ? Spectrogram.ROW_MARKER_ENABLED
                : Spectrogram.ROW_MARKER_DISABLED
        );
    }
}

// ----------------------

function smartTimerListener() {
    var
        frequencyData,
        fftResult,
        rxBinMin,
        rxBinMax,
        loudestBinIndex,
        fftNominalResolution,
        fftSkippedResolution;

    frequencyData = audioMonoIO.getFrequencyData();
    fftResult = new FFTResult(frequencyData, audioMonoIO.getSampleRate());
    fftResult.downconvert(fftFrequencyBinSkipFactor.getValue());
    rxBinMin = fftResult.getBinIndex(rxFrequencyMin.getValue());
    rxBinMax = fftResult.getBinIndex(rxFrequencyMax.getValue());
    loudestBinIndex = fftResult.getLoudestBinIndexInBinRange(rxBinMin, rxBinMax);
    fftNominalResolution = audioMonoIO.getSampleRate() / getFftSize();
    fftSkippedResolution = fftNominalResolution * fftFrequencyBinSkipFactor.getValue();

    html('#rx-sample-rate', (audioMonoIO.getSampleRate() / 1000).toFixed(1));

    if (isRecording) {
        recordedData.indexMin = rxBinMin;
        recordedData.indexMax = rxBinMax;
        recordedData.frequencySpacing = fftSkippedResolution;
        recordedData.history = recordedData.history ? recordedData.history : [];
        recordedData.history.push({
            dateTime: new Date(),
            frequencyData: fftResult.getFrequencyData(),
            indexMarker: loudestBinIndex
        });
    }

    if (!document.getElementById('rx-draw-spectrogram').checked) {
        return;
    }

    rxSpectrogram.add(
        fftResult.getFrequencyData(),
        rxBinMin,
        rxBinMax,
        fftSkippedResolution,
        document.getElementById('loudest-marker').checked
            ? loudestBinIndex
            : Spectrogram.INDEX_MARKER_DISABLED,
        Spectrogram.ROW_MARKER_DISABLED
    );

    rxSampleCount++;
}

