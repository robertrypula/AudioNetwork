// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayerV2Builder = function () {
    this._fftSize = 8192;
    this._unitTime = 0.25;
    this._fftSkipFactor = 3;
    this._samplePerSymbol = 2;
    this._symbolMin44100 = 114;
    this._symbolMin48000 = 83;
    this._symbolMinDefault = 1;
    this._symbolRange = 256 + 2;    // 256 for data, 2 for sync code
    this._txSampleRate = 44100;
    this._amplitude = 0.1;
    this._syncCode = [1, -1, 1, -1, 1, -1];
    this._signalDecibelThresholdFactor = 0.85;
};

PhysicalLayerV2Builder.prototype.build = function () {
    return new PhysicalLayerV2(this);
};

/*
var pl = PlBuilder
  .rrSymbolListener(listenerA)
  .rxRawListener(listenerB)
  .rxConfigListener()
  .txListener
  .txConfigListener
  .build();
 */

// -----------

var PhysicalLayerV2;

PhysicalLayerV2 = function (builder) {
    // general config
    this.$$fftSize = builder._fftSize;
    this.$$audioMonoIO = new AudioMonoIO(this.$$fftSize);
    this.$$unitTime = builder._unitTime;
    this.$$smartTimer = new SmartTimer(
        Math.round(PhysicalLayerV2.$$_MILISECOND_IN_SECOND * this.$$unitTime)
    );
    this.$$smartTimer.setHandler(this.$$smartTimerListener.bind(this));
    this.$$fftSkipFactor = builder._fftSkipFactor;
    this.$$samplePerSymbol = builder._samplePerSymbol;
    this.$$symbolMin44100 = builder._symbolMin44100;
    this.$$symbolMin48000 = builder._symbolMin48000;
    this.$$symbolMinDefault = builder._symbolMinDefault;
    this.$$symbolRange = builder._symbolRange;
    this.$$rxSampleRate = this.$$audioMonoIO.getSampleRate();
    this.$$amplitude = builder._amplitude;
    this.$$syncCode = builder._syncCode.slice(0);
    this.$$syncCodeDetector = new SyncCodeDetector(
        this.$$samplePerSymbol,
        this.$$syncCode
    );
    this.$$signalDecibelThresholdFactor = builder._signalDecibelThresholdFactor;

    // state variables
    this.$$sampleNumber = PhysicalLayerV2.$$_INITIAL_SAMPLE_NUMER;
    this.$$offset = undefined;
    this.$$symbolId = PhysicalLayerV2.$$_INITIAL_ID;
    this.$$sampleId = PhysicalLayerV2.$$_INITIAL_ID;
    this.$$symbol = undefined;
    this.$$symbolRaw = undefined;
    this.$$signalDecibel = undefined;
    this.$$signalNextCandidateDecibel = undefined;
    this.$$signalFrequency = undefined;
    this.$$noiseDecibel = undefined;
    this.$$frequencyData = undefined;
    this.$$isSyncInProgress = undefined;
    this.$$isSymbolSamplingPoint = undefined;
    this.$$signalDecibelThreshold = PhysicalLayerV2.$$_INITIAL_SIGNAL_DECIBEL_THRESHOLD;

    this.$$txSymbol = PhysicalLayerV2.$$_TX_SYMBOL_NULL;
    this.$$txSymbolQueue = [];

    this.$$rxSymbolMin = this.$$getSymbolMin(this.$$rxSampleRate);
    this.$$rxSymbolMax = this.$$getSymbolMax(this.$$rxSampleRate);
    this.setTxSampleRate(builder._txSampleRate);

    // setup listeners

};

PhysicalLayerV2.$$_MILISECOND_IN_SECOND = 1000;
PhysicalLayerV2.$$_INITIAL_SAMPLE_NUMER = 0;
PhysicalLayerV2.$$_INITIAL_ID = 1;
PhysicalLayerV2.$$_INITIAL_SIGNAL_DECIBEL_THRESHOLD = +Infinity;
PhysicalLayerV2.$$_TX_SYMBOL_NULL = null;
PhysicalLayerV2.$$_TX_AMPLITUDE_SILENT = 0;
PhysicalLayerV2.$$_FIRST_SYMBOL = 1;

// -----------------------------------------

/*
PhysicalLayer.prototype.sendSyncCode = function (sampleRate) {   // sendconnectCode
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

PhysicalLayer.prototype.sendSymbol = function (symbol) {         // sendSymbol
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
*/

PhysicalLayerV2.prototype.setTxSampleRate = function (txSampleRate) {
    this.$$txSampleRate = txSampleRate;
    this.$$txSymbolMin = this.$$getSymbolMin(this.$$txSampleRate);
    this.$$txSymbolMax = this.$$getSymbolMax(this.$$txSampleRate);
    this.$$txSymbolQueue.length = 0;
};

PhysicalLayerV2.prototype.setLoopback = function (state) {
    this.$$audioMonoIO.setLoopback(state);
};

// -----------------------------------------

PhysicalLayerV2.prototype.getRxSymbol = function () {
    return {
        id: this.$$symbolId,
        symbol: this.$$symbol,
        sampleId: this.$$sampleId
    };
};

PhysicalLayerV2.prototype.getRxSample = function () {
    var sync = this.$$syncCodeDetector.getSync();

    return {
        id: this.$$sampleId,
        offset: this.$$offset,
        symbolRaw: this.$$symbolRaw,
        signalDecibel: this.$$signalDecibel,
        signalNextCandidateDecibel: this.$$signalNextCandidateDecibel,
        signalFrequency: this.$$signalFrequency,
        noiseDecibel: this.$$noiseDecibel,
        frequencyData: this.$$frequencyData.slice(0),
        isSyncInProgress: this.$$isSyncInProgress,
        isSymbolSamplingPoint: this.$$isSymbolSamplingPoint,
        syncId: sync.id
    };
};

PhysicalLayerV2.prototype.getRxSync = function () {
    var sync = this.$$syncCodeDetector.getSync();

    return {
        id: sync.id,
        symbolSamplingPointOffset: sync.symbolSamplingPointOffset,
        correlationValue: sync.correlationValue,
        decibelAverageSignal: sync.decibelAverageSignal,
        decibelAverageNoise: sync.decibelAverageNoise,
        signalToNoiseRatio: sync.signalToNoiseRatio
    };
};

PhysicalLayerV2.prototype.getRxConfig = function () {
    var symbolFrequencySpacing = this.$$getFrequency(
        PhysicalLayerV2.$$_FIRST_SYMBOL,
        this.$$rxSampleRate
    );

    return {
        sampleRate: this.$$rxSampleRate,
        symbolFrequencySpacing: symbolFrequencySpacing,
        symbolMin: this.$$rxSymbolMin,
        symbolMax: this.$$rxSymbolMax,
        signalDecibelThreshold: this.$$signalDecibelThreshold
    };
};

PhysicalLayerV2.prototype.getConfig = function () {
    return {
        fftSkipFactor: this.$$fftSkipFactor,
        fftSize: this.$$fftSize,
        samplePerSymbol: this.$$samplePerSymbol,
        unitTime: this.$$unitTime,
        correlationCodeLength: this.$$syncCode.length,
        loopback: this.$$audioMonoIO.isLoopbackEnabled()
    };
};

PhysicalLayerV2.prototype.getTx = function () {
    return {
        symbol: this.$$txSymbol,
        symbolQueue: this.$$txSymbolQueue.split(0)
    }
};

PhysicalLayerV2.prototype.getTxConfig = function () {
    var symbolFrequencySpacing = this.$$getFrequency(
        PhysicalLayerV2.$$_FIRST_SYMBOL,
        this.$$txSampleRate
    );

    return {
        sampleRate: this.$$txSampleRate,
        symbolFrequencySpacing: symbolFrequencySpacing,
        symbolMin: this.$$txSymbolMin,
        symbolMax: this.$$txSymbolMax,
        amplitude: this.$$amplitude
    }
};

// -----------------------------------------

PhysicalLayerV2.prototype.$$smartTimerListener = function () {
    this.$$offset = this.$$sampleNumber % this.$$samplePerSymbol;
    this.$$rx();
    this.$$tx();

    console.log('tes');

    this.$$sampleNumber++;
};

PhysicalLayerV2.prototype.$$rx = function () {
    var fftResult;

    this.$$frequencyData = this.$$audioMonoIO.getFrequencyData();
    fftResult = new FFTResult(this.$$frequencyData, this.$$rxSampleRate);
    fftResult.downconvertScalar(this.$$fftSkipFactor);
    this.$$symbolRaw = fftResult.getLoudestBinIndexInBinRange(this.$$rxSymbolMin, this.$$rxSampleRate);
    this.$$signalDecibel = fftResult.getDecibel(this.$$symbolRaw);
    this.$$signalNextCandidateDecibel = undefined; // TODO add this
    this.$$noiseDecibel = fftResult.getDecibelAverage(this.$$rxSymbolMin, this.$$rxSymbolMax, this.$$symbolRaw);

    /*
    connectSignalValue = this.$$getConnectionSignalValue(this.$$symbol);
    this.$$syncCodeDetector.handle(
        connectSignalValue, this.$$signalDecibel, this.$$noiseDecibel
    );

    connection = this.$$syncCodeDetector.getConnection();
    if (connection && connection.id !== this.$$connectionLastId) {
        this.$$signalThresholdDecibel = connection.decibelAverageNoise +
            this.$$rxSignalThresholdFactor * connection.signalToNoiseRatio;
        this.$$connectionLastId = connection.id;
    }

    this.$$isSymbolSamplingPoint = this.$$syncCodeDetector.isConnected()
        ? (this.$$offset) === connection.symbolSamplingPointOffset
        : false;

    isSignalAboveThreshold = this.$$syncCodeDetector.isConnected()
        ? this.$$signalDecibel > this.$$signalThresholdDecibel
        : false;

    this.$$isSymbolReadyToTake = this.$$isSymbolSamplingPoint && isSignalAboveThreshold;
    */
};

PhysicalLayerV2.prototype.$$tx = function () {
    var isFirstSampleOfBlock = this.$$offset === 0;

    if (isFirstSampleOfBlock) {
        this.$$txSymbol = this.$$txQueue.length > 0
            ? this.$$txQueue.shift()
            : PhysicalLayerV2.$$_TX_SYMBOL_NULL;
    }
    this.$$updateOscillator();
};

// -------

/*
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
*/

PhysicalLayerV2.prototype.$$getSymbolMin = function (sampleRate) {
    switch (sampleRate) {
        case 44100:
            return this.$$symbolMin44100;
        case 48000:
            return this.$$symbolMin48000;
        default:
            return this.$$symbolMinDefault;
    }
};

PhysicalLayerV2.prototype.$$getSymbolMax = function (sampleRate) {
    var symbolMin = this.$$getSymbolMin(sampleRate);
    
    return symbolMin + this.$$symbolRange - 1;
};

PhysicalLayerV2.prototype.$$updateOscillator = function () {
    var frequency, amplitude;

    if (this.$$txCurrentSymbol === PhysicalLayerV2.$$_TX_SYMBOL_NULL) {
        frequency = PhysicalLayerV2.$$_TX_SYMBOL_NULL;
        amplitude = PhysicalLayerV2.$$_TX_AMPLITUDE_SILENT;
    } else {
        frequency = this.$$getFrequency(this.$$txSymbol, this.$$txSampleRate);
        amplitude = this.$$txAmplitude;
    }

    this.$$audioMonoIO.setPeriodicWave(frequency, amplitude);
};

PhysicalLayerV2.prototype.$$getFrequency = function (symbol, sampleRate) {
    return (this.$$fftSkipFactor * symbol * sampleRate) / this.$$fftSize;
};

PhysicalLayerV2.$$isFunction = function (variable) {
    return typeof variable === 'function';
};
