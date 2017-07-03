// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    SAMPLE_TIME_MS = 250,   // 500 or 166
    SAMPLE_PER_SYMBOL = 3,
    FFT_SIZE = 8 * 1024,
    FFT_FREQUENCY_BIN_SKIP_FACTOR = 3,

    SYMBOL_MIN = 93,
    SYMBOL_MAX = 117,
    SYMBOL_SYNC_A = 108,
    SYMBOL_SYNC_B = 109,

    /*
    48.0 kHz -> skipping 5 -> 29.296875 Hz      - 7 617 Hz
    44.1 kHz -> skipping 5 -> 26.91650390625 Hz - 6 998 Hz

    48.0 kHz -> skipping 3 -> 17.578125 Hz      - 4 570 Hz
    44.1 kHz -> skipping 3 -> 16.14990234375 Hz - 4 199 Hz
     */

    TX_SAMPLE_RATE_DEFAULT = 48000,
    TX_AMPLITUDE = 0.1,
    RX_SIGNAL_THRESHOLD_FACTOR = 0.85,

    audioMonoIO,
    smartTimer,

    txOffset,
    rxOffset,
    symbol,
    signalDecibel,
    noiseDecibel,
    frequencyDataReceiveBand,

    connectSignalDetector,
    isSymbolSamplingPoint,
    isSynchronizedSymbol,
    rxSymbolList = [],
    rxSpectrogram,
    rxSampleNumber = 0,
    txSampleRate,
    txSampleNumber = 0,
    txCurrentSymbol = null,
    txSymbolQueue = [],
    state;

function init() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE);
    connectSignalDetector = new ConnectSignalDetector(SAMPLE_PER_SYMBOL, RX_SIGNAL_THRESHOLD_FACTOR);

    initFloatWidget();

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    smartTimer = new SmartTimer(SAMPLE_TIME_MS / 1000);
    smartTimer.setHandler(function () {
        rxSmartTimerHandler();
        txSmartTimerHandler();
    });

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

function setTxSound() {
    var frequency;

    if (!txCurrentSymbol) {
        audioMonoIO.setPeriodicWave(undefined, 0);
        return;
    }

    frequency = FFT_FREQUENCY_BIN_SKIP_FACTOR * txCurrentSymbol * txSampleRate.getValue() / FFT_SIZE;

    if (SAMPLE_PER_SYMBOL === 3) {
        switch (txOffset) {
            case 0:
                audioMonoIO.setPeriodicWave(frequency, 0);
                audioMonoIO.setPeriodicWaveFading(TX_AMPLITUDE, (0.5 * SAMPLE_TIME_MS) / 1000, SAMPLE_TIME_MS / 1000);
                // audioMonoIO.setPeriodicWave(frequency, 0.5 * TX_AMPLITUDE);
                break;
            case 1:
                audioMonoIO.setPeriodicWave(frequency, TX_AMPLITUDE);
                break;
            case 2:
                audioMonoIO.setPeriodicWaveFading(0, (0.5 * SAMPLE_TIME_MS) / 1000, SAMPLE_TIME_MS / 1000);
                // audioMonoIO.setPeriodicWave(frequency, 0.5 * TX_AMPLITUDE);
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
        dataLogicValue,
        frequencyData,
        fftResult;

    rxOffset = rxSampleNumber % SAMPLE_PER_SYMBOL;
    frequencyData = audioMonoIO.getFrequencyData();
    fftResult = new FFTResult(frequencyData, audioMonoIO.getSampleRate());
    fftResult.downconvertScalar(FFT_FREQUENCY_BIN_SKIP_FACTOR);
    symbol = fftResult.getLoudestBinIndexInBinRange(SYMBOL_MIN, SYMBOL_MAX);
    signalDecibel = fftResult.getDecibel(symbol);
    noiseDecibel = fftResult.getDecibelAverage(SYMBOL_MIN, SYMBOL_MAX, symbol);
    frequencyDataReceiveBand = fftResult.getDecibelRange(SYMBOL_MIN, SYMBOL_MAX);

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

    state = {
        dsp: {
            sampleRateReceive: 44100,
            sampleRateTranmit: 48000,
            fftSize: 2048,
            fftWindowTime: 0.046,
            fftFrequencyBinSkipFactor: FFT_FREQUENCY_BIN_SKIP_FACTOR,
            samplePerSymbol: SAMPLE_PER_SYMBOL
        },
        band: {
            frequencyData: frequencyDataReceiveBand,
            frequencyDataLoudestIndex: symbol - SYMBOL_MIN,
            indexMin: SYMBOL_MIN,
            indexMax: SYMBOL_MAX,
            indexRange: SYMBOL_MAX - SYMBOL_MIN + 1,
            frequencyMin: fftResult.getFrequency(SYMBOL_MIN),
            frequencyMax: fftResult.getFrequency(SYMBOL_MAX)
        },
        symbol: symbol,
        symbolDetail: {
            frequency: fftResult.getFrequency(symbol),
            signalDecibel: signalDecibel,
            noiseDecibel: noiseDecibel
        },
        isConnected: connectSignalDetector.isConnected(),
        isConnectionInProgress: connectSignalDetector.isConnectionInProgress(),
        isSymbolSamplingPoint: isSymbolSamplingPoint,
        isSynchronizedSymbol: isSynchronizedSymbol,
        connectionDetail: connectSignalDetector.getConnectionDetail()
    };

    if (isSynchronizedSymbol) {
        rxSymbolList.push(symbol);
        // TODO call symbol handler here
    }
    // TODO call status handler here
    rxUpdateView(state);

    rxSampleNumber++;
}

function rxUpdateView(state) {
    var cd;

    html('#rx-sample-rate', audioMonoIO.getSampleRate());

    if (state.isConnectionInProgress) {
        html('#rx-log-connect', 'connecting...');
    } else {
        if (state.isConnected) {
            cd = state.connectionDetail;
            html(
                '#rx-log-connect',
                'Connected!<br/>' +
                '- offset ' + cd.offset + '<br/>' +
                '- signal ' + cd.signalDecibel.toFixed(2) + ' dB' + '<br/>' +
                '- noise ' + cd.noiseDecibel.toFixed(2) + ' dB' + '<br/>' +
                '- SNR ' + cd.signalToNoiseRatio.toFixed(2) + ' dB' + '<br/>' +
                '- correlation ' + cd.correlationValue + '/' + cd.correlationValueMax + '<br/>' +
                '- threshold ' + cd.signalThresholdDecibel.toFixed() + ' dB'
            );
        } else {
            html('#rx-log-connect', 'not connected');
        }
    }

    if (document.getElementById('rx-active').checked) {
        rxSpectrogram.add(
            state.band.frequencyData,
            document.getElementById('loudest-marker').checked ? state.band.frequencyDataLoudestIndex : -1,
            state.band.indexMin,
            1,
            state.isSynchronizedSymbol
        );
    }

    if (state.isConnected) {
        if (state.isSymbolSamplingPoint) {
            if (state.isSynchronizedSymbol) {
                html('#rx-symbol-synchronized', state.symbol + ' (' + state.symbolDetail.signalDecibel.toFixed(2) + ' dB)');
                refreshRxSymbolList();
            } else {
                html('#rx-symbol-synchronized', 'idle');
                html('#rx-symbol-synchronized-detail', '');
            }
        }
    } else {
        html('#rx-symbol-synchronized', '');
    }

    html('#rx-symbol', state.symbol);
    html(
        '#rx-symbol-detail',
        rxOffset + '/' + rxSampleNumber + ', ' +
        state.symbolDetail.frequency.toFixed(2) + ' Hz, ' +
        state.symbolDetail.signalDecibel.toFixed(2) + ' dB'
    );
    html(
        '#rx-log',
        'min: ' + state.band.indexMin + ' (' + state.band.frequencyMin.toFixed(2) + ' Hz)<br/>' +
        'max: ' + state.band.indexMax + ' (' + state.band.frequencyMax.toFixed(2) + ' Hz)<br/>' +
        'range: ' + state.band.indexRange + '<br/>'
    );
}

function txSmartTimerHandler() {
    txOffset = txSampleNumber % SAMPLE_PER_SYMBOL;

    if (txOffset === 0) {
        txCurrentSymbol = txSymbolQueue.shift();
    }

    setTxSound();
    refreshTxSymbolQueue();

    txSampleNumber++;
}
