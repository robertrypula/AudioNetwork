// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    RX_RESOLUTION_EXPONENT = 2,
    RX_FFT_SIZE_EXPONENT = 13,
    TX_FFT_SIZE_EXPONENT = RX_FFT_SIZE_EXPONENT - RX_RESOLUTION_EXPONENT,
    TX_FINE_TUNE_MIDDLE_FREQUENCY = 50,
    FREQUENCY_MIN = 1500,
    FREQUENCY_TX = 1650,
    FREQUENCY_MAX = 1700,
    RX_TIME_MS = 200,
    TX_TIME_MS = 600,
    TX_SAMPLE_RATE = 48000,
    TX_AMPLITUDE = 0.05,

    audioMonoIO,
    domLoopbackCheckbox,
    rxSpectrogram,
    rxSampleCount = 0,
    packetReceptionInProgress,

    rxFrequencyCalculator,
    rxSmartTimer,
    rxFftSizeExponent,
    rxTimeMs,
    rxIndexMin,
    rxIndexMax,
    rxResolutionExponent,
    rxSymbolSamplingEvery,
    rxSymbolSamplingOffset,
    rxFrameSymbolStart,
    rxFrameSymbolEnd,

    txFrequencyCalculator,
    txSampleRate,
    txSmartTimer,
    txFftSizeExponent,
    txTimeMs,
    txIndexMin,
    txIndexMax,
    txIndexToTransmit,
    txAmplitude,
    txFineTune;

function init() {
    audioMonoIO = new AudioMonoIO(Math.pow(2, RX_FFT_SIZE_EXPONENT));
    rxFrequencyCalculator = new FrequencyCalculator(
        function () {
            return audioMonoIO.getSampleRate();
        },
        function () {
            return Math.pow(2, rxFftSizeExponent.getValue());
        }
    );
    txFrequencyCalculator = new FrequencyCalculator(
        function () {
            return txSampleRate.getValue();
        },
        function () {
            return Math.pow(2, txFftSizeExponent.getValue());
        }
    );

    document.getElementById('rx-sample-rate').innerHTML = audioMonoIO.getSampleRate();
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');

    initFloatWidget();

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));

    rxSmartTimer = new SmartTimer(
        rxTimeMs.getValue() / 1000
    );
    rxSmartTimer.setHandler(rxSmartTimerHandler);

    txSmartTimer = new SmartTimer(
        txTimeMs.getValue() / 1000
    );
    txSmartTimer.setHandler(txSmartTimerHandler);

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
    }
}

function setTxSound(indexToTransmit) {
    var frequency, frequencyFineTune;

    if (!indexToTransmit) {
        audioMonoIO.setPeriodicWave(0);
        return;
    }

    frequency = txFrequencyCalculator.getHertzFromCyclePerWindow(indexToTransmit);
    frequencyFineTune = txFineTune.getValue();
    audioMonoIO.setPeriodicWave(
        frequency - 50 + frequencyFineTune,   // TODO negative values in widget are missing, fix it!!
        txAmplitude.getValue()
    );
}

function initFloatWidget() {
    rxFftSizeExponent = new EditableFloatWidget(
        document.getElementById('rx-fft-size-exponent'),
        RX_FFT_SIZE_EXPONENT, 2, 0,
        onRxFftSizeExponentChange
    );
    rxTimeMs = new EditableFloatWidget(
        document.getElementById('rx-time-ms'),
        RX_TIME_MS, 4, 0,
        onRxTimeMsChange
    );
    rxIndexMin = new EditableFloatWidget(
        document.getElementById('rx-index-min'),
        Math.round(Math.pow(2, rxFftSizeExponent.getValue()) * FREQUENCY_MIN / audioMonoIO.getSampleRate()) - 4, 4, 0,
        onRxIndexMinChange
    );
    rxIndexMax = new EditableFloatWidget(
        document.getElementById('rx-index-max'),
        Math.round(Math.pow(2, rxFftSizeExponent.getValue()) * FREQUENCY_MAX / audioMonoIO.getSampleRate()) + 4, 4, 0,
        onRxIndexMaxChange
    );
    rxResolutionExponent = new EditableFloatWidget(
        document.getElementById('rx-resolution-exponent'),
        RX_RESOLUTION_EXPONENT, 1, 0,
        onRxResolutionExponentChange
    );

    rxSymbolSamplingEvery = new EditableFloatWidget(
        document.getElementById('rx-symbol-sampling-every'),
        3, 1, 0,
        null
    );
    rxSymbolSamplingOffset = new EditableFloatWidget(
        document.getElementById('rx-symbol-sampling-offset'),
        0, 1, 0,
        null
    );
    rxFrameSymbolStart = new EditableFloatWidget(
        document.getElementById('rx-frame-symbol-start'),
        Math.round((rxIndexMin.getValue() + 4) / Math.pow(2, rxResolutionExponent.getValue())), 4, 0,
        null
    );
    rxFrameSymbolEnd = new EditableFloatWidget(
        document.getElementById('rx-frame-symbol-end'),
        Math.round((rxIndexMax.getValue() - 4) / Math.pow(2, rxResolutionExponent.getValue())), 4, 0,
        null
    );

    rxFftSizeExponent.forceUpdate();
    rxIndexMin.forceUpdate();
    rxIndexMax.forceUpdate();
    rxResolutionExponent.forceUpdate();

    // ---

    txSampleRate = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        TX_SAMPLE_RATE, 5, 0,
        onTxSampleRateChange
    );
    txFftSizeExponent = new EditableFloatWidget(
        document.getElementById('tx-fft-size-exponent'),
        TX_FFT_SIZE_EXPONENT, 2, 0,
        onTxFftSizeExponentChange
    );
    txTimeMs = new EditableFloatWidget(
        document.getElementById('tx-time-ms'),
        TX_TIME_MS, 4, 0,
        onTxTimeMsChange
    );
    txIndexMin = new EditableFloatWidget(
        document.getElementById('tx-index-min'),
        Math.round(Math.pow(2, txFftSizeExponent.getValue()) * FREQUENCY_MIN / audioMonoIO.getSampleRate()), 4, 0,
        onTxIndexMinChange
    );
    txIndexMax = new EditableFloatWidget(
        document.getElementById('tx-index-max'),
        Math.round(Math.pow(2, txFftSizeExponent.getValue()) * FREQUENCY_MAX / audioMonoIO.getSampleRate()), 4, 0,
        onTxIndexMaxChange
    );
    txIndexToTransmit = new EditableFloatWidget(
        document.getElementById('tx-index-to-transmit'),
        Math.round(Math.pow(2, txFftSizeExponent.getValue()) * FREQUENCY_TX / audioMonoIO.getSampleRate()), 4, 0,
        onTxIndexToTransmitChange
    );
    txAmplitude = new EditableFloatWidget(
        document.getElementById('tx-amplitude'),
        TX_AMPLITUDE, 1, 9,
        onTxAmplitudeChange
    );
    txFineTune = new EditableFloatWidget(
        document.getElementById('tx-fine-tune'),
        TX_FINE_TUNE_MIDDLE_FREQUENCY, 2, 9,
        onTxFineTuneChange
    );

    txFftSizeExponent.forceUpdate();
    txIndexMin.forceUpdate();
    txIndexMax.forceUpdate();
    txIndexToTransmit.forceUpdate();
}

// ----------------------

function onRxFftSizeExponentChange() {
    var fftSize;

    fftSize = Math.pow(2, rxFftSizeExponent.getValue());
    audioMonoIO.setFFTSize(fftSize);

    html('#rx-fft-size', fftSize);
    html('#rx-fft-size-time', (1000 * fftSize / audioMonoIO.getSampleRate()).toFixed(1) + ' ms');
    html('#rx-fft-size-resolution', (audioMonoIO.getSampleRate() / fftSize).toFixed(6) + ' Hz');

    rxIndexMin.forceUpdate();
    rxIndexMax.forceUpdate();
}

function onRxTimeMsChange() {
    rxSmartTimer.setInterval(
        rxTimeMs.getValue() / 1000
    );
}

function onRxIndexMinChange() {
    var hertz = rxFrequencyCalculator.getHertzFromCyclePerWindow(rxIndexMin.getValue());

    html('#rx-index-min-frequency', hertz.toFixed(6) + ' Hz');
}

function onRxIndexMaxChange() {
    var hertz = rxFrequencyCalculator.getHertzFromCyclePerWindow(rxIndexMax.getValue());

    html('#rx-index-max-frequency', hertz.toFixed(6) + ' Hz');
}

function onRxResolutionExponentChange() {
    html('#rx-resolution-value', Math.pow(2, rxResolutionExponent.getValue()));

    if (rxSpectrogram) {
        rxSpectrogram.forceClearInNextAdd();
    }
}

// ---

function onTxSampleRateChange() {
    txSampleRate.getValue();

    txIndexMin.forceUpdate();
    txIndexMax.forceUpdate();
}

function onTxFftSizeExponentChange() {
    var fftSize;

    fftSize = Math.pow(2, txFftSizeExponent.getValue());

    html('#tx-fft-size', fftSize);
    html('#tx-fft-size-resolution', (txSampleRate.getValue() / fftSize).toFixed(6) + ' Hz');

    txIndexMin.forceUpdate();
    txIndexMax.forceUpdate();
}

function onTxTimeMsChange() {
    txSmartTimer.setInterval(
        txTimeMs.getValue() / 1000
    );
}

function onTxIndexMinChange() {
    var hertz = txFrequencyCalculator.getHertzFromCyclePerWindow(txIndexMin.getValue());

    html('#tx-index-min-frequency', hertz.toFixed(6) + ' Hz');
    onTxImmediatelyChange();
}

function onTxIndexMaxChange() {
    var hertz = txFrequencyCalculator.getHertzFromCyclePerWindow(txIndexMax.getValue());

    html('#tx-index-max-frequency', hertz.toFixed(6) + ' Hz');
    onTxImmediatelyChange();
}

function onTxIndexToTransmitChange() {
    var hertz = txFrequencyCalculator.getHertzFromCyclePerWindow(txIndexToTransmit.getValue());

    html('#tx-index-to-transmit-frequency', hertz.toFixed(6) + ' Hz');
    onTxImmediatelyChange();
}

function onTxAmplitudeChange() {
    onTxImmediatelyChange();
}

function onTxFineTuneChange() {
    onTxImmediatelyChange();
}

// ----------------------

function onTxImmediatelyChange() {
    var checked = document.getElementById('tx-immediately').checked;

    setTxSound(checked ? txIndexToTransmit.getValue() : 0);
}

function onTxAddToQueueNearWidget() {
    document.getElementById('tx-symbol-edit').value += ' ' + txIndexToTransmit.getValue();
}

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
        loudestBinIndex,
        potentialFrequencyBinIndexAtTxSide,
        htmlString,
        frequencyDataInner = [],
        rxResolutionValue,
        indexSpan,
        isSampleToStore,
        i;

    if (typeof rxSampleCount === 'undefined') {
        rxSampleCount = 0;
    } else {
        rxSampleCount++;
    }


    loudestBinIndex = fftResult.getLoudestBinIndex(
        fftResult.getFrequency(rxIndexMin.getValue()),
        fftResult.getFrequency(rxIndexMax.getValue())
    );

    rxResolutionValue = Math.pow(2, rxResolutionExponent.getValue());

    potentialFrequencyBinIndexAtTxSide = Math.round(loudestBinIndex / rxResolutionValue);
    html('#rx-frequency-bin', potentialFrequencyBinIndexAtTxSide + ' (' + loudestBinIndex + ')');

    isSampleToStore = (rxSampleCount - rxSymbolSamplingOffset.getValue()) % rxSymbolSamplingEvery.getValue() === 0;

    if (isSampleToStore && document.getElementById('rx-symbol-logging-checkbox').checked) {
        htmlString = '<div>' + potentialFrequencyBinIndexAtTxSide + '</div>';
        html('#rx-symbol-log', htmlString, true);
    }

    if (isSampleToStore) {
        if (!packetReceptionInProgress && potentialFrequencyBinIndexAtTxSide === rxFrameSymbolStart.getValue()) {
            packetReceptionInProgress = true;
        }
        if (packetReceptionInProgress) {
            htmlString = '<div>' + potentialFrequencyBinIndexAtTxSide + '</div>';
            html('#rx-packet-log', htmlString, true);
        }
        if (packetReceptionInProgress && potentialFrequencyBinIndexAtTxSide === rxFrameSymbolEnd.getValue()) {
            htmlString = '<div class="packet-separator">-</div>';
            html('#rx-packet-log', htmlString, true);
            packetReceptionInProgress = false;
        }
    }

    if (!document.getElementById('rx-spectrum-logging-checkbox').checked) {
        return;
    }

    indexSpan = 3 * rxResolutionValue;
    htmlString = '';
    for (i = -indexSpan; i <= indexSpan; i++) {
        htmlString += '' +
            'Decibels at ' +
            '[' +
            'rx = ' + (loudestBinIndex + i) + ', ' +
            'tx = ' + ((loudestBinIndex + i) / rxResolutionValue).toFixed(3) +
            ']: ' +
            frequencyData[loudestBinIndex + i].toFixed(6) +
            ' dB' + (i === 0 ? ' <--- loudest' : '') +
            '<br/>';
    }
    html('#spectrogram-log', htmlString);

    for (i = rxIndexMin.getValue(); i <= rxIndexMax.getValue(); i++) {
        frequencyDataInner.push(frequencyData[i]);
    }

    rxSpectrogram.add(
        frequencyDataInner,
        document.getElementById('loudest-marker').checked
            ? loudestBinIndex - rxIndexMin.getValue()
            : -1,
        rxIndexMin.getValue(),
        rxResolutionValue,
        isSampleToStore
    );
}

function txSmartTimerHandler() {
    var
        isPlayingAlready = document.getElementById('tx-immediately').checked,
        firstNode = select('#tx-symbol-queue > div:first-child'),
        symbol;

    if (isPlayingAlready) {
        return;
    }

    if (firstNode.length > 0){
        symbol = parseInt(firstNode[0].innerHTML);
        firstNode[0].parentNode.removeChild(firstNode[0]);
    } else {
        symbol = 0;
    }

    setTxSound(symbol);
}
