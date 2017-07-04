// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    /*
    48.0 kHz -> skipping 5 -> 29.296875 Hz      - 7 617 Hz
    44.1 kHz -> skipping 5 -> 26.91650390625 Hz - 6 998 Hz

    48.0 kHz -> skipping 3 -> 17.578125 Hz      - 4 570 Hz
    44.1 kHz -> skipping 3 -> 16.14990234375 Hz - 4 199 Hz
     */

    this__$$sampleTimeMs = 250,   // 500 or 166
    this__$$samplePerSymbol = 3,
    this__$$fftSize = 8 * 1024,
    this__$$fftFrequencyBinSkipFactor = 3,
    this__$$symbolMin = 93,
    this__$$symbolMax = 117,
    this__$$symbolSyncA = 108,
    this__$$symbolSyncB = 109,
    this__$$txAmplitude = 0.1,
    this__$$rxSignalThresholdFactor = 0.85,
    this__$$audioMonoIO,
    this__$$smartTimer,
    this__$$sampleNumber = 0,
    this__$$offset,
    this__$$symbol,
    this__$$signalDecibel,
    this__$$noiseDecibel,
    this__$$txSampleRate,
    this__$$frequencyDataReceiveBand,
    this__$$fftResult,
    this__$$connectSignalDetector,
    this__$$isSymbolSamplingPoint,
    this__$$isSymbolAboveThreshold,
    this__$$txCurrentSymbol = null,
    this__$$txSymbolQueue = [],
    this__$$statusHandler,

    rxSpectrogram,
    rxSymbolList = [],
    txSampleRateWidget;

function init() {
    construct();

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    txSampleRateWidget = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        getTxSampleRate(), 5, 0,
        onTxSampleRateWidgetChange
    );
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

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    setLoopback(document.getElementById('loopback-checkbox').checked);
}

function onTxSampleRateWidgetChange() {
    setTxSampleRate(txSampleRateWidget.getValue());
}

function refreshTxSymbolQueue() {
    var txSymbolQueue = getTxSymbolQueue();

    html('#tx-symbol-queue', txSymbolQueue.join(', '));
}

function refreshRxSymbolList() {
    html('#rx-symbol-list', rxSymbolList.join(', '));
}

function statusHandler(state) {
    if (state.isSymbolSamplingPoint) {
        rxSymbolList.push(state.symbol);
    }
    rxUpdateView(state);
}

function rxUpdateView(state) {
    var cd;

    html('#rx-sample-rate', state.dsp.sampleRateReceive);

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
            state.isSymbolAboveThreshold
        );
    }

    if (state.isConnected) {
        if (state.isSymbolSamplingPoint) {
            if (state.isSymbolAboveThreshold) {
                html('#rx-symbol-synchronized', state.symbol + ' (' + state.symbolDetail.signalDecibel.toFixed(2) + ' dB)');
                refreshRxSymbolList();
            } else {
                html('#rx-symbol-synchronized', 'idle');
            }
        }
    } else {
        html('#rx-symbol-synchronized', '');
    }

    html('#rx-symbol', state.symbol);
    html(
        '#rx-symbol-detail',
        state.offset + '/' + state.sampleNumber + ', ' +
        state.symbolDetail.frequency.toFixed(2) + ' Hz, ' +
        state.symbolDetail.signalDecibel.toFixed(2) + ' dB'
    );
    html(
        '#rx-log',
        'min: ' + state.band.indexMin + ' (' + state.band.frequencyMin.toFixed(2) + ' Hz)<br/>' +
        'max: ' + state.band.indexMax + ' (' + state.band.frequencyMax.toFixed(2) + ' Hz)<br/>' +
        'range: ' + state.band.indexRange + '<br/>'
    );

    refreshTxSymbolQueue();
}

function onConnectClick(sampleRate) {
    txSampleRateWidget.setValue(sampleRate);
    txConnect(sampleRate);
    refreshTxSymbolQueue();
}

function onSymbolClick(symbol) {
    txSymbol(symbol);
    refreshTxSymbolQueue();
}

// --------------------------------------------------------------------

function construct() {

    this__$$statusHandler = statusHandler;

    this__$$audioMonoIO = new AudioMonoIO(this__$$fftSize);
    this__$$connectSignalDetector = new ConnectSignalDetector(this__$$samplePerSymbol, this__$$rxSignalThresholdFactor);

    this__$$txSampleRate = 48000;

    this__$$smartTimer = new SmartTimer(this__$$sampleTimeMs / 1000);
    this__$$smartTimer.setHandler($$smartTimerHandler);
}

function txConnect(sampleRate) {
    var i, codeValue;

    this__$$txSampleRate = sampleRate;
    for (i = 0; i < this__$$connectSignalDetector.$$correlator.getCodeLength(); i++) {  // TODO refactor this
        codeValue = this__$$connectSignalDetector.$$correlator.getCodeValue(i);
        $$addToTxQueue(
            codeValue === -1 ? this__$$symbolSyncA : this__$$symbolSyncB
        );
    }
}

function txSymbol(symbol) {
    $$addToTxQueue(symbol);
}

function getState() {
    var state;

    state = {
        dsp: {
            sampleRateReceive: this__$$audioMonoIO.getSampleRate(),
            sampleRateTransmit: this__$$txSampleRate,
            fftSize: this__$$fftSize,
            fftWindowTime: this__$$fftSize / this__$$audioMonoIO.getSampleRate(),
            fftFrequencyBinSkipFactor: this__$$fftFrequencyBinSkipFactor,
            samplePerSymbol: this__$$samplePerSymbol
        },
        band: {
            frequencyData: this__$$frequencyDataReceiveBand,
            frequencyDataLoudestIndex: this__$$symbol - this__$$symbolMin,
            indexMin: this__$$symbolMin,
            indexMax: this__$$symbolMax,
            indexRange: this__$$symbolMax - this__$$symbolMin + 1,
            frequencyMin: this__$$fftResult.getFrequency(this__$$symbolMin),
            frequencyMax: this__$$fftResult.getFrequency(this__$$symbolMax)
        },
        symbol: this__$$symbol,
        isSymbolSamplingPoint: this__$$isSymbolSamplingPoint,
        isSymbolAboveThreshold: this__$$isSymbolAboveThreshold,
        symbolDetail: {
            frequency: this__$$fftResult.getFrequency(this__$$symbol),
            signalDecibel: this__$$signalDecibel,
            noiseDecibel: this__$$noiseDecibel
        },
        offset: this__$$offset,
        sampleNumber: this__$$sampleNumber,
        isConnected: this__$$connectSignalDetector.isConnected(),
        isConnectionInProgress: this__$$connectSignalDetector.isConnectionInProgress(),
        connectionDetail: this__$$connectSignalDetector.getConnectionDetail()
    };

    return state;
}

function setLoopback(state) {
    this__$$audioMonoIO.setLoopback(state);
}

function getTxSampleRate() {
    return this__$$txSampleRate;
}

function getTxSymbolQueue() {
    return this__$$txSymbolQueue;
}

function setTxSampleRate(sampleRate) {
    this__$$txSampleRate = sampleRate;
}

function $$setTxSound() {
    var frequency;

    if (!this__$$txCurrentSymbol) {
        this__$$audioMonoIO.setPeriodicWave(undefined, 0);
        return;
    }

    frequency = this__$$fftFrequencyBinSkipFactor * this__$$txCurrentSymbol * this__$$txSampleRate / this__$$fftSize;

    if (this__$$samplePerSymbol === 3) {
        switch (this__$$offset) {
            case 0:
                this__$$audioMonoIO.setPeriodicWave(frequency, 0);
                this__$$audioMonoIO.setPeriodicWaveFading(this__$$txAmplitude, (0.5 * this__$$sampleTimeMs) / 1000, this__$$sampleTimeMs / 1000);
                // this__$$audioMonoIO.setPeriodicWave(frequency, 0.5 * this__$$txAmplitude);
                break;
            case 1:
                this__$$audioMonoIO.setPeriodicWave(frequency, this__$$txAmplitude);
                break;
            case 2:
                this__$$audioMonoIO.setPeriodicWaveFading(0, (0.5 * this__$$sampleTimeMs) / 1000, this__$$sampleTimeMs / 1000);
                // this__$$audioMonoIO.setPeriodicWave(frequency, 0.5 * this__$$txAmplitude);
                break;
        }
    } else {
        this__$$audioMonoIO.setPeriodicWave(frequency, this__$$txAmplitude);
    }
}

function $$addToTxQueue(symbol) {
    this__$$txSymbolQueue.push(symbol);
}

function $$smartTimerHandler() {
    var state;

    this__$$offset = this__$$sampleNumber % this__$$samplePerSymbol;
    $$rxSmartTimerHandler();
    $$txSmartTimerHandler();
    state = getState();

    if (this__$$statusHandler) {
        this__$$statusHandler(state);
    }

    this__$$sampleNumber++;
}

function $$rxSmartTimerHandler() {
    var
        dataLogicValue,
        frequencyData;

    frequencyData = this__$$audioMonoIO.getFrequencyData();
    this__$$fftResult = new FFTResult(frequencyData, this__$$audioMonoIO.getSampleRate());
    this__$$fftResult.downconvertScalar(this__$$fftFrequencyBinSkipFactor);
    this__$$symbol = this__$$fftResult.getLoudestBinIndexInBinRange(this__$$symbolMin, this__$$symbolMax);
    this__$$signalDecibel = this__$$fftResult.getDecibel(this__$$symbol);
    this__$$noiseDecibel = this__$$fftResult.getDecibelAverage(this__$$symbolMin, this__$$symbolMax, this__$$symbol);
    this__$$frequencyDataReceiveBand = this__$$fftResult.getDecibelRange(this__$$symbolMin, this__$$symbolMax);

    switch (this__$$symbol) {
        case this__$$symbolSyncA: dataLogicValue = false; break;
        case this__$$symbolSyncB: dataLogicValue = true; break;
        default: dataLogicValue = null;
    }
    this__$$connectSignalDetector.handle(this__$$sampleNumber, dataLogicValue, this__$$signalDecibel, this__$$noiseDecibel);

    this__$$isSymbolSamplingPoint = this__$$connectSignalDetector.isConnected()
        ? (this__$$sampleNumber % this__$$samplePerSymbol) === this__$$connectSignalDetector.getConnectionDetail().offset
        : false;
    this__$$isSymbolAboveThreshold =
        this__$$isSymbolSamplingPoint &&
        (this__$$signalDecibel > this__$$connectSignalDetector.getConnectionDetail().signalThresholdDecibel);
}

function $$txSmartTimerHandler() {
    if (this__$$offset === 0) {
        this__$$txCurrentSymbol = this__$$txSymbolQueue.shift();
    }
    $$setTxSound();
}
