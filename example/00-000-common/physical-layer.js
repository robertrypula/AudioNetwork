// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayer;

PhysicalLayer = function (stateHandler, configuration) {
    var
        c = configuration || {},
        vod = PhysicalLayer.$$getValueOrDefault,
        symbolMin;

    this.$$fftSize = vod(c.fftSize, 8 * 1024);          // should this be constant?
    this.$$audioMonoIO = new AudioMonoIO(this.$$fftSize);

    // 258 symbols, skip factor 3
    // 44.1 kHz -> 16.14990234375 Hz -> start 1841 Hz, stop 6008 Hz, bandwidth 4167 Hz -> symbolMin 114
    // 48.0 kHz -> 17.578125 Hz      -> start 1458 Hz, stop 5994 Hz, bandwidth 4535 Hz -> symbolMin 83
    symbolMin = 98; // TODO fix this bug: this.$$audioMonoIO.getSampleRate() === 44100 ? 114 : 83;

    // TODO implement builder class that will replace configuration object
    this.$$sampleTimeMs = vod(c.sampleTimeMs, 250);
    this.$$samplePerSymbol = vod(c.samplePerSymbol, 2);
    this.$$fftFrequencyBinSkipFactor = vod(c.fftFrequencyBinSkipFactor, 3);
    this.$$symbolMin = vod(c.symbolMin, symbolMin);
    this.$$symbolMax = vod(c.symbolMax, (this.$$symbolMin - 1) + 256 + 2);     // 8-bit data (256 symbol), connection signal (2 symbols)
    this.$$symbolSyncA = vod(c.symbolSyncA, this.$$symbolMax - 1);
    this.$$symbolSyncB = vod(c.symbolSyncB, this.$$symbolMax - 0);
    this.$$txAmplitude = vod(c.txAmplitude, 0.1);
    this.$$rxSignalThresholdFactor = vod(c.rxSignalThresholdFactor, 0.85);

    this.$$sampleNumber = 0;
    this.$$offset = undefined;
    this.$$symbol = undefined;
    this.$$signalDecibel = undefined;
    this.$$noiseDecibel = undefined;
    this.$$frequencyDataReceiveBand = undefined;
    this.$$fftResult = undefined;
    this.$$isSymbolSamplingPoint = undefined;
    this.$$isSymbolReadyToTake = undefined;
    this.$$txCurrentSymbol = PhysicalLayer.NULL_SYMBOL;
    this.$$txSymbolQueue = [];
    this.$$signalThresholdDecibel = 0;
    this.$$connectionDetailLastId = undefined;

    this.$$stateHandler = PhysicalLayer.$$isFunction(stateHandler) ? stateHandler : null;
    this.$$connectCodeDetector = new ConnectCodeDetector(this.$$samplePerSymbol, PhysicalLayer.CONNECT_CODE);
    this.$$txSampleRate = PhysicalLayer.DEFAULF_TX_SAMPLE_RATE;
    this.$$smartTimer = new SmartTimer(this.$$sampleTimeMs / 1000);
    this.$$smartTimer.setHandler(this.$$smartTimerHandler.bind(this));
};

PhysicalLayer.CONNECT_CODE = [1, -1, 1, -1, 1, -1];
PhysicalLayer.DEFAULF_TX_SAMPLE_RATE = 48000;
PhysicalLayer.NULL_SYMBOL = null;
PhysicalLayer.SYMBOL_IS_NOT_VALID_EXCEPTION = 'Symbol is not valid. Please pass number that is inside symbol range.';

PhysicalLayer.prototype.txConnect = function (sampleRate) {   // sendconnectCode
    var i, connectCode, codeValue, symbol;

    connectCode = PhysicalLayer.CONNECT_CODE;
    this.$$txSampleRate = sampleRate;
    for (i = 0; i < connectCode.length; i++) {
        codeValue = connectCode[i];
        symbol = codeValue === -1
            ? this.$$symbolSyncA
            : this.$$symbolSyncB;
        this.$$txSymbolQueue.push(symbol);
    }
};

PhysicalLayer.prototype.txSymbol = function (symbol) {         // sendSymbol
    var isNumber, symbolParsed, isValid;

    if (symbol === PhysicalLayer.NULL_SYMBOL) {
        this.$$txSymbolQueue.push(PhysicalLayer.NULL_SYMBOL);
    } else {
        symbolParsed = parseInt(symbol);
        isNumber = typeof symbolParsed === 'number';
        isValid = isNumber && this.$$symbolMin <= symbolParsed && symbolParsed <= this.$$symbolMax;

        if (!isValid) {
            throw PhysicalLayer.SYMBOL_IS_NOT_VALID_EXCEPTION;
        }

        this.$$txSymbolQueue.push(symbolParsed);
    }
};

PhysicalLayer.prototype.setLoopback = function (state) {
    this.$$audioMonoIO.setLoopback(state);
};

PhysicalLayer.prototype.getTxSampleRate = function () {   // remove
    return this.$$txSampleRate;
};

PhysicalLayer.prototype.getTxSymbolQueue = function () {   // remove
    return this.$$txSymbolQueue;
};

PhysicalLayer.prototype.setTxSampleRate = function (sampleRate) {
    this.$$txSampleRate = sampleRate;
    this.$$txSymbolQueue.length = 0;
};


PhysicalLayer.prototype.getState = function () { /// getRxState, getTxState, getGeneralState
    var state, cd;

    cd = this.$$connectCodeDetector.isConnected()
        ? this.$$connectCodeDetector.getConnectionDetail()
        : null;

    state = {
        dsp: {
            sampleRateReceive: this.$$audioMonoIO.getSampleRate(),
            sampleRateTransmit: this.$$txSampleRate,
            fftSize: this.$$fftSize,
            fftWindowTime: this.$$fftSize / this.$$audioMonoIO.getSampleRate(),
            fftFrequencyBinSkipFactor: this.$$fftFrequencyBinSkipFactor,
            symbolFrequencySpacing: this.$$fftFrequencyBinSkipFactor * this.$$audioMonoIO.getSampleRate() / this.$$fftSize,
            samplePerSymbol: this.$$samplePerSymbol
        },
        band: {
            frequencyData: this.$$frequencyDataReceiveBand,
            frequencyDataLoudestIndex: this.$$symbol - this.$$symbolMin,
            symbolMin: this.$$symbolMin,
            symbolMax: this.$$symbolMax,
            symbolRange: this.$$symbolMax - this.$$symbolMin + 1,
            frequencyMin: this.$$fftResult.getFrequency(this.$$symbolMin),
            frequencyMax: this.$$fftResult.getFrequency(this.$$symbolMax)
        },
        symbol: this.$$symbol,
        isSymbolSamplingPoint: this.$$isSymbolSamplingPoint,
        isSymbolReadyToTake: this.$$isSymbolReadyToTake,
        symbolDetail: {
            frequency: this.$$fftResult.getFrequency(this.$$symbol),
            signalDecibel: this.$$signalDecibel,
            signalNextCandidateDecibel: 0, // TODO compute those values
            signalQuality: 3,              // TODO compute those values
            noiseDecibel: this.$$noiseDecibel
        },
        offset: this.$$offset,
        sampleNumber: this.$$sampleNumber,
        isConnected: this.$$connectCodeDetector.isConnected(),
        isConnectionInProgress: this.$$connectCodeDetector.isConnectionInProgress(),
        signalThresholdDecibel: this.$$signalThresholdDecibel,
        connectCodeLength: PhysicalLayer.CONNECT_CODE.length,
        connectionDetail: !cd ? null : {
            id: cd.id,
            offset: cd.offset,
            correlationValue: cd.correlationValue,
            decibelAverageSignal: cd.decibelAverageSignal,
            decibelAverageNoise: cd.decibelAverageNoise,
            signalToNoiseRatio: cd.signalToNoiseRatio
        }
    };

    return state;
};

PhysicalLayer.$$isFunction = function (variable) {
    return typeof variable === 'function';
};

PhysicalLayer.$$getValueOrDefault = function (value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
};

PhysicalLayer.prototype.$$updateOscillator = function () {
    var frequency;

    if (this.$$txCurrentSymbol === PhysicalLayer.NULL_SYMBOL) {
        this.$$audioMonoIO.setPeriodicWave(undefined, 0);
        return;
    }

    frequency = (
        this.$$fftFrequencyBinSkipFactor *
        this.$$txCurrentSymbol *
        this.$$txSampleRate
    ) / this.$$fftSize;

    if (this.$$samplePerSymbol === 3) {
        switch (this.$$offset) {
            case 0:
                this.$$audioMonoIO.setPeriodicWave(frequency, 0);
                this.$$audioMonoIO.setPeriodicWaveFading(
                    this.$$txAmplitude,
                    (0.5 * this.$$sampleTimeMs) / 1000,
                    this.$$sampleTimeMs / 1000
                );
                // this.$$audioMonoIO.setPeriodicWave(frequency, 0.5 * this.$$txAmplitude);
                break;
            case 1:
                this.$$audioMonoIO.setPeriodicWave(frequency, this.$$txAmplitude);
                break;
            case 2:
                this.$$audioMonoIO.setPeriodicWaveFading(
                    0,
                    (0.5 * this.$$sampleTimeMs) / 1000,
                    this.$$sampleTimeMs / 1000
                );
                // this.$$audioMonoIO.setPeriodicWave(frequency, 0.5 * this.$$txAmplitude);
                break;
        }
    } else {
        this.$$audioMonoIO.setPeriodicWave(frequency, this.$$txAmplitude);
    }
};

PhysicalLayer.prototype.$$smartTimerHandler = function () {
    var state;

    this.$$offset = this.$$sampleNumber % this.$$samplePerSymbol;
    this.$$rxSmartTimerHandler();
    this.$$txSmartTimerHandler();
    state = this.getState();

    if (this.$$stateHandler) {
        this.$$stateHandler(state);
    }

    this.$$sampleNumber++;
};

PhysicalLayer.prototype.$$getConnectionSignalValue = function (symbol) {
    var
        allowedToListenConnectSignal,
        connectSignalValue = 0;

    allowedToListenConnectSignal =
        this.$$txCurrentSymbol === PhysicalLayer.NULL_SYMBOL ||
        this.$$audioMonoIO.isLoopbackEnabled();

    if (allowedToListenConnectSignal) {
        switch (symbol) {
            case this.$$symbolSyncA:
                connectSignalValue = -1;
                break;
            case this.$$symbolSyncB:
                connectSignalValue = 1;
                break;
        }
    }

    return connectSignalValue;
};

PhysicalLayer.prototype.$$rxSmartTimerHandler = function () {
    var
        connectSignalValue,
        frequencyData,
        connectionDetail,
        isSignalAboveThreshold;

    frequencyData = this.$$audioMonoIO.getFrequencyData();
    this.$$fftResult = new FFTResult(frequencyData, this.$$audioMonoIO.getSampleRate());
    this.$$fftResult.downconvertScalar(this.$$fftFrequencyBinSkipFactor);
    this.$$symbol = this.$$fftResult.getLoudestBinIndexInBinRange(this.$$symbolMin, this.$$symbolMax);
    this.$$signalDecibel = this.$$fftResult.getDecibel(this.$$symbol);
    this.$$noiseDecibel = this.$$fftResult.getDecibelAverage(this.$$symbolMin, this.$$symbolMax, this.$$symbol);
    this.$$frequencyDataReceiveBand = this.$$fftResult.getDecibelRange(this.$$symbolMin, this.$$symbolMax);

    connectSignalValue = this.$$getConnectionSignalValue(this.$$symbol);
    this.$$connectCodeDetector.handle(
        connectSignalValue, this.$$signalDecibel, this.$$noiseDecibel
    );

    connectionDetail = this.$$connectCodeDetector.getConnectionDetail();
    if (connectionDetail && connectionDetail.id !== this.$$connectionDetailLastId) {
        this.$$signalThresholdDecibel = connectionDetail.decibelAverageNoise +
            this.$$rxSignalThresholdFactor * connectionDetail.signalToNoiseRatio;
        this.$$connectionDetailLastId = connectionDetail.id;
    }

    this.$$isSymbolSamplingPoint = this.$$connectCodeDetector.isConnected()
        ? (this.$$sampleNumber % this.$$samplePerSymbol) === connectionDetail.offset
        : false;

    isSignalAboveThreshold = this.$$connectCodeDetector.isConnected()
        ? this.$$signalDecibel > this.$$signalThresholdDecibel
        : false;

    this.$$isSymbolReadyToTake = this.$$isSymbolSamplingPoint && isSignalAboveThreshold;
};

PhysicalLayer.prototype.$$txSmartTimerHandler = function () {
    var isFirstSampleOfBlock = this.$$offset === 0;

    if (isFirstSampleOfBlock) {
        this.$$txCurrentSymbol = this.$$txSymbolQueue.length > 0
            ? this.$$txSymbolQueue.shift()
            : PhysicalLayer.NULL_SYMBOL;
    }
    this.$$updateOscillator();
};
