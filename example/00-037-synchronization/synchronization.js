// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    SAMPLE_TIME_MS = 333,   // 500 or 166
    SAMPLE_PER_SYMBOL = 3,
    FFT_SIZE = 8 * 1024,
    FFT_FREQUENCY_BIN_SKIP_FACTOR = 5,

    SYMBOL_MIN = 93,
    SYMBOL_MAX = 117,
    SYMBOL_SYNC_A = 108,
    SYMBOL_SYNC_B = 109,

    TX_SAMPLE_RATE_DEFAULT = 48000,
    TX_AMPLITUDE = 0.1,
    RX_SIGNAL_THRESHOLD_FACTOR = 0.3,

    audioMonoIO,

    connectSignalDetector,
    isSymbolSamplingPoint,
    isSynchronizedSymbol,
    rxSymbolList = [],
    rxSpectrogram,
    rxSampleNumber = 0,
    rxSmartTimer,

    txSmartTimer,
    txSampleRate,
    txSampleNumber = 0,
    txCurrentSymbol = null,
    txSymbolQueue = [];

function init() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE);
    connectSignalDetector = new ConnectSignalDetector(SAMPLE_PER_SYMBOL, RX_SIGNAL_THRESHOLD_FACTOR);
    document.getElementById('rx-sample-rate').innerHTML = audioMonoIO.getSampleRate();

    initFloatWidget();

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    rxSmartTimer = new SmartTimer(SAMPLE_TIME_MS / 1000);
    rxSmartTimer.setHandler(rxSmartTimerHandler);

    setTimeout(function () {
        txSmartTimer = new SmartTimer(SAMPLE_TIME_MS / 1000);
        txSmartTimer.setHandler(txSmartTimerHandler);
    }, SAMPLE_TIME_MS * 0.5);

    onLoopbackCheckboxChange();

    document.addEventListener('keyup', function(e) {
        var digit = null;

        if (e.keyCode >= 48 && e.keyCode <= 57) {
            digit = e.keyCode - 48;
        } else {
            if (e.keyCode >= 96 && e.keyCode <= 105) {
                digit = e.keyCode - 96;
            }
        }

        if (digit !== null) {
            txSymbol(100 + digit);
        }
    }, true);
}

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(document.getElementById('loopback-checkbox').checked);
    }
}

function initFloatWidget() {
    txSampleRate = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        TX_SAMPLE_RATE_DEFAULT, 5, 0,
        null
    );
}

function setTxSound(symbol, offset) {
    var frequency;

    if (!symbol) {
        audioMonoIO.setPeriodicWave(undefined, 0);
        return;
    }

    frequency = FFT_FREQUENCY_BIN_SKIP_FACTOR * symbol * txSampleRate.getValue() / FFT_SIZE;

    if (SAMPLE_PER_SYMBOL === 3) {
        switch (offset) {
            case 0:
                // audioMonoIO.setPeriodicWave(frequency, 0);
                // audioMonoIO.setPeriodicWaveFading(TX_AMPLITUDE, (0.5 * SAMPLE_TIME_MS) / 1000, SAMPLE_TIME_MS / 1000);
                audioMonoIO.setPeriodicWave(frequency, 0.5 * TX_AMPLITUDE);
                break;
            case 1:
                audioMonoIO.setPeriodicWave(frequency, TX_AMPLITUDE);
                break;
            case 2:
                //audioMonoIO.setPeriodicWaveFading(0, (0.5 * SAMPLE_TIME_MS) / 1000, SAMPLE_TIME_MS / 1000);
                audioMonoIO.setPeriodicWave(frequency, 0.5 * TX_AMPLITUDE);
                break;
        }
    } else {
        audioMonoIO.setPeriodicWave(frequency, TX_AMPLITUDE);
    }
}

function refreshTxSymbolQueue() {
    html('#tx-symbol-queue', txSymbolQueue.join(', '));
}

function refreshRxSymbolList() {
    html('#rx-symbol-list', rxSymbolList.join(', '));
}

// ----------------------

function addToTxQueue(symbol) {
    txSymbolQueue.push(symbol);
}

function txConnect(sampleRate) {
    var i, codeValue;


    txSampleRate.setValue(sampleRate);
    for (i = 0; i < connectSignalDetector.$$correlator.getCodeLength(); i++) {  // TODO refactor this
        codeValue = connectSignalDetector.$$correlator.getCodeValue(i);
        addToTxQueue(
            codeValue === -1 ? SYMBOL_SYNC_A : SYMBOL_SYNC_B
        );
    }
    refreshTxSymbolQueue();
}

function txSymbol(symbol) {
    addToTxQueue(symbol);
    refreshTxSymbolQueue();
}

function rxSmartTimerHandler() {
    var
        offset = rxSampleNumber % SAMPLE_PER_SYMBOL,
        dataLogicValue,
        frequencyData,
        fftResult,
        symbol,
        signalDecibel,
        noiseDecibelSum,
        noiseDecibel,
        frequencyDataInner = [],
        i;

    frequencyData = audioMonoIO.getFrequencyData();
    fftResult = new FFTResult(frequencyData, audioMonoIO.getSampleRate());
    fftResult.downconvertScalar(FFT_FREQUENCY_BIN_SKIP_FACTOR);
    symbol = fftResult.getLoudestBinIndexInBinRange(SYMBOL_MIN, SYMBOL_MAX);
    signalDecibel = fftResult.getDecibel(symbol);

    // ----- move to fftResult class, get decibelrange and get average in range
    noiseDecibelSum = 0;
    for (i = SYMBOL_MIN; i <= SYMBOL_MAX; i++) {
        frequencyDataInner.push(fftResult.getDecibel(i));
        if (i !== symbol) {
            noiseDecibelSum += fftResult.getDecibel(i);
        }
    }
    noiseDecibel = null;
    if (frequencyDataInner.length > 1) {
        noiseDecibel = noiseDecibelSum / (frequencyDataInner.length - 1);
    }
    // -----

    switch (symbol) {
        case SYMBOL_SYNC_A: dataLogicValue = false; break;
        case SYMBOL_SYNC_B: dataLogicValue = true; break;
        default: dataLogicValue = null;
    }
    connectSignalDetector.handle(rxSampleNumber, dataLogicValue, signalDecibel, noiseDecibel);

    isSymbolSamplingPoint = connectSignalDetector.isConnected()
        ? (rxSampleNumber % SAMPLE_PER_SYMBOL) === connectSignalDetector.getConnectionDetail().offset
        : false;
    isSynchronizedSymbol =
        isSymbolSamplingPoint &&
        (signalDecibel > connectSignalDetector.getConnectionDetail().signalThresholdDecibel);

    if (isSynchronizedSymbol) {
        rxSymbolList.push(symbol);
    }

    rxUpdateView(frequencyDataInner, symbol, offset, signalDecibel, fftResult);

    rxSampleNumber++;
}

function rxUpdateView(frequencyDataInner, symbol, offset, signalDecibel, fftResult) {
    var signalQualityDecibel, cd;

    if (connectSignalDetector.isConnectionInProgress()) {
        html('#rx-log-connect', 'connecting...');
    } else {
        if (connectSignalDetector.isConnected()) {
            cd = connectSignalDetector.getConnectionDetail();
            html(
                '#rx-log-connect',
                'Connected!<br/>' +
                '- offset ' + cd.offset + '<br/>' +
                '- signal ' + cd.signalDecibel.toFixed(2) + ' dB' + '<br/>' +
                '- noise ' + cd.noiseDecibel.toFixed(2) + ' dB' + '<br/>' +
                '- SNR ' + cd.signalToNoiseRatio.toFixed(2) + ' dB' + '<br/>' +
                '- correlation ' + cd.correlationValue + '/' + cd.correlationValueMax + '<br/>' +
                '- threshold ' + cd.signalThresholdDecibel.toFixed() + 'dB'
            );
            //console.log(connectionDetail);
        } else {
            html('#rx-log-connect', 'not connected');
        }
    }

    //console.log(isSynchronizedSymbol);

    if (document.getElementById('rx-active').checked) {
        rxSpectrogram.add(
            frequencyDataInner,
            document.getElementById('loudest-marker').checked ? symbol - SYMBOL_MIN : -1,
            SYMBOL_MIN,
            1,
            isSynchronizedSymbol
        );
    }

    if (connectSignalDetector.isConnected()) {
        if (isSymbolSamplingPoint) {
            if (isSynchronizedSymbol) {
                signalQualityDecibel = Math.round(signalDecibel - connectSignalDetector.getConnectionDetail().signalThresholdDecibel);
                html('#rx-symbol-synchronized', symbol + ' (' + signalQualityDecibel + ' dB)');
                refreshRxSymbolList();
            } else {
                html('#rx-symbol-synchronized', 'idle');
                html('#rx-symbol-synchronized-detail', '');
            }
        }
    } else {
        html('#rx-symbol-synchronized', '');
    }

    html('#rx-symbol', symbol);
    html(
        '#rx-symbol-detail',
        offset + '/' + rxSampleNumber + ', ' +
        fftResult.getFrequency(symbol).toFixed(2) + ' Hz, ' +
        signalDecibel.toFixed(2) + ' dB'
    );
    html(
        '#rx-log',
        'min: ' + SYMBOL_MIN + ' (' + fftResult.getFrequency(SYMBOL_MIN).toFixed(2) + ' Hz)<br/>' +
        'max: ' + SYMBOL_MAX + ' (' + fftResult.getFrequency(SYMBOL_MAX).toFixed(2) + ' Hz)<br/>' +
        'range: ' + (SYMBOL_MAX - SYMBOL_MIN + 1) + '<br/>'
    );
}

function txSmartTimerHandler() {
    var offset = txSampleNumber % SAMPLE_PER_SYMBOL;

    if (offset === 0) {
        txCurrentSymbol = txSymbolQueue.shift();
    }

    setTxSound(txCurrentSymbol, offset);
    refreshTxSymbolQueue();

    txSampleNumber++;
}
