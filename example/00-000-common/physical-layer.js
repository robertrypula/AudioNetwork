// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayerBuilder = function () {
    this._fftSize = 8192;
    this._unitTime = 0.25;
    this._fftSkipFactor = 3;
    this._samplePerSymbol = 2;
    this._symbolMin44100 = 114;
    this._symbolMin48000 = 82;
    this._symbolMinDefault = 1;
    this._symbolRange = 256 + 2;    // 256 for data, 2 for sync code
    this._txSampleRate = 44100;
    this._amplitude = 0.2;
    this._syncCode = [1, -1, 1, -1];      // [1, -1, 1, -1, 1, -1];
    this._signalDecibelThresholdFactor = 0.6;

    this._rxSymbolListener = undefined;
    this._rxSampleListener = undefined;
    this._rxSyncListener = undefined;
    this._rxConfigListener = undefined;
    this._configListener = undefined;
    this._txListener = undefined;
    this._txConfigListener = undefined;
};

PhysicalLayerBuilder.prototype.fftSize = function (fftSize) {
    this._fftSize = fftSize;
    return this;
};

PhysicalLayerBuilder.prototype.unitTime = function (unitTime) {
    this._unitTime = unitTime;
    return this;
};

PhysicalLayerBuilder.prototype.fftSkipFactor = function (fftSkipFactor) {
    this._fftSkipFactor = fftSkipFactor;
    return this;
};

PhysicalLayerBuilder.prototype.samplePerSymbol = function (samplePerSymbol) {
    this._samplePerSymbol = samplePerSymbol;
    return this;
};

PhysicalLayerBuilder.prototype.symbolMin44100 = function (symbolMin44100) {
    this._symbolMin44100 = symbolMin44100;
    return this;
};

PhysicalLayerBuilder.prototype.symbolMin48000 = function (symbolMin48000) {
    this._symbolMin48000 = symbolMin48000;
    return this;
};

PhysicalLayerBuilder.prototype.symbolMinDefault = function (symbolMinDefault) {
    this._symbolMinDefault = symbolMinDefault;
    return this;
};

PhysicalLayerBuilder.prototype.symbolRange = function (symbolRange) {
    this._symbolRange = symbolRange;
    return this;
};

PhysicalLayerBuilder.prototype.amplitude = function (amplitude) {
    this._amplitude = amplitude;
    return this;
};

PhysicalLayerBuilder.prototype.rxSymbolListener = function (listener) {
    this._rxSymbolListener = listener;
    return this;
};

PhysicalLayerBuilder.prototype.rxSampleListener = function (listener) {
    this._rxSampleListener = listener;
    return this;
};

PhysicalLayerBuilder.prototype.rxSyncListener = function (listener) {
    this._rxSyncListener = listener;
    return this;
};

PhysicalLayerBuilder.prototype.rxConfigListener = function (listener) {
    this._rxConfigListener = listener;
    return this;
};

PhysicalLayerBuilder.prototype.configListener = function (listener) {
    this._configListener = listener;
    return this;
};

PhysicalLayerBuilder.prototype.txListener = function (listener) {
    this._txListener = listener;
    return this;
};

PhysicalLayerBuilder.prototype.txConfigListener = function (listener) {
    this._txConfigListener = listener;
    return this;
};

PhysicalLayerBuilder.prototype.build = function () {
    return new PhysicalLayer(this);
};

// -----------------------------------------------------------------------------------------

var PhysicalLayer;

PhysicalLayer = function (builder) {
    // general config
    this.$$fftSize = builder._fftSize;
    this.$$audioMonoIO = new AudioMonoIO(this.$$fftSize);
    this.$$unitTime = builder._unitTime;
    this.$$smartTimer = new SmartTimer(this.$$unitTime);
    this.$$smartTimer.setListener(this.$$smartTimerListener.bind(this));
    this.$$fftSkipFactor = builder._fftSkipFactor;
    this.$$samplePerSymbol = builder._samplePerSymbol;
    this.$$symbolMin44100 = builder._symbolMin44100;
    this.$$symbolMin48000 = builder._symbolMin48000;
    this.$$symbolMinDefault = builder._symbolMinDefault;
    this.$$symbolRange = builder._symbolRange;
    this.$$rxSampleRate = this.$$audioMonoIO.getSampleRate();
    this.$$amplitude = builder._amplitude;
    this.$$syncCode = builder._syncCode.slice(0);
    this.$$syncCodeDetector = new SyncCodeDetector(this.$$samplePerSymbol, this.$$syncCode);
    this.$$signalDecibelThresholdFactor = builder._signalDecibelThresholdFactor;

    // state variables
    this.$$sampleNumber = PhysicalLayer.$$_INITIAL_SAMPLE_NUMER;
    this.$$offset = undefined;
    this.$$symbolId = PhysicalLayer.$$_INITIAL_ID;
    this.$$sampleId = PhysicalLayer.$$_INITIAL_ID;
    this.$$symbol = undefined;
    this.$$symbolRaw = undefined;
    this.$$signalDecibel = undefined;
    this.$$signalDecibelNextCandidate = undefined;
    this.$$noiseDecibel = undefined;
    this.$$frequencyData = undefined;
    this.$$isSyncInProgress = undefined;
    this.$$isSymbolSamplingPoint = undefined;
    this.$$signalDecibelThreshold = PhysicalLayer.$$_INITIAL_SIGNAL_DECIBEL_THRESHOLD;
    this.$$syncLastId = undefined;
    this.$$txSymbol = PhysicalLayer.$$_SYMBOL_IDLE;
    this.$$txSymbolQueue = [];

    // symbol ranges depends on sampleRate
    this.$$rxSymbolMin = this.$$getSymbolMin(this.$$rxSampleRate);
    this.$$rxSymbolMax = this.$$getSymbolMax(this.$$rxSampleRate);
    this.$$txSampleRate = undefined;
    this.$$txSymbolMin = undefined;
    this.$$txSymbolMax = undefined;
    this.setTxSampleRate(builder._txSampleRate);

    // setup listeners
    this.$$rxSymbolListener = PhysicalLayer.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
    this.$$rxSampleListener = PhysicalLayer.$$isFunction(builder._rxSampleListener) ? builder._rxSampleListener : null;
    this.$$rxSyncListener = PhysicalLayer.$$isFunction(builder._rxSyncListener) ? builder._rxSyncListener : null;
    this.$$rxConfigListener = PhysicalLayer.$$isFunction(builder._rxConfigListener) ? builder._rxConfigListener : null;
    this.$$configListener = PhysicalLayer.$$isFunction(builder._configListener) ? builder._configListener : null;
    this.$$txListener = PhysicalLayer.$$isFunction(builder._txListener) ? builder._txListener : null;
    this.$$txConfigListener = PhysicalLayer.$$isFunction(builder._txConfigListener) ? builder._txConfigListener : null;

    this.$$firstSmartTimerCall = true;
};

PhysicalLayer.$$_INITIAL_SAMPLE_NUMER = 0;
PhysicalLayer.$$_INITIAL_ID = 0;   // will be incremented BEFORE first use
PhysicalLayer.$$_INITIAL_SIGNAL_DECIBEL_THRESHOLD = +Infinity;
PhysicalLayer.$$_SYMBOL_IDLE = null;
PhysicalLayer.$$_TX_AMPLITUDE_SILENT = 0;
PhysicalLayer.$$_FIRST_SYMBOL = 1;
PhysicalLayer.$$_SYNC_SYMBOL_A_OFFSET = 1;
PhysicalLayer.$$_SYNC_SYMBOL_B_OFFSET = 0;
PhysicalLayer.SYMBOL_IS_NOT_VALID_EXCEPTION = 'Symbol is not valid. Please pass number that is inside symbol range.';

// -----------------------------------------

PhysicalLayer.prototype.sendSync = function () {
    var i, codeValue, symbol;

    for (i = 0; i < this.$$syncCode.length; i++) {
        codeValue = this.$$syncCode[i];
        symbol = codeValue === -1
            ? this.$$txSymbolMax - PhysicalLayer.$$_SYNC_SYMBOL_A_OFFSET
            : this.$$txSymbolMax - PhysicalLayer.$$_SYNC_SYMBOL_B_OFFSET;
        this.$$txSymbolQueue.push(symbol);
    }
    this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
};

PhysicalLayer.prototype.sendSymbol = function (symbol) {
    var isNumber, symbolParsed, inRange, isValid;

    if (symbol === PhysicalLayer.$$_SYMBOL_IDLE) {
        this.$$txSymbolQueue.push(PhysicalLayer.$$_SYMBOL_IDLE);
    } else {
        symbolParsed = parseInt(symbol);
        isNumber = typeof symbolParsed === 'number';
        inRange = this.$$txSymbolMin <= symbolParsed && symbolParsed <= this.$$txSymbolMax;
        isValid = isNumber && inRange;

        if (!isValid) {
            throw PhysicalLayer.SYMBOL_IS_NOT_VALID_EXCEPTION;
        }

        this.$$txSymbolQueue.push(symbolParsed);
    }
    this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
};

PhysicalLayer.prototype.setTxSampleRate = function (txSampleRate) {
    this.$$txSampleRate = txSampleRate;
    this.$$txSymbolMin = this.$$getSymbolMin(this.$$txSampleRate);
    this.$$txSymbolMax = this.$$getSymbolMax(this.$$txSampleRate);
    this.$$txSymbolQueue.length = 0;
    this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
    this.$$txConfigListener ? this.$$txConfigListener(this.getTxConfig()) : undefined;
};

PhysicalLayer.prototype.setLoopback = function (state) {
    this.$$audioMonoIO.setLoopback(state);
    this.$$configListener ? this.$$configListener(this.getConfig()) : undefined;
};

PhysicalLayer.prototype.setAmplitude = function (amplitude) {
    this.$$amplitude = amplitude;
    this.$$txConfigListener ? this.$$txConfigListener(this.getTxConfig()) : undefined;
};

// -----------------------------------------

PhysicalLayer.prototype.getRxSymbol = function () {
    return {
        id: this.$$symbolId,
        symbol: this.$$symbol,
        sampleId: this.$$sampleId
    };
};

PhysicalLayer.prototype.getRxSample = function () {
    var sync = this.$$syncCodeDetector.getSync();

    return {
        id: this.$$sampleId,
        symbolRaw: this.$$symbolRaw,
        signalDecibel: this.$$signalDecibel,
        // signalDecibelNextCandidate: this.$$signalDecibelNextCandidate,  // TODO add this at some point
        noiseDecibel: this.$$noiseDecibel,
        frequencyData: this.$$frequencyData.slice(0),
        isSyncInProgress: this.$$isSyncInProgress,
        isSymbolSamplingPoint: this.$$isSymbolSamplingPoint,
        sampleNumber: this.$$sampleNumber,
        offset: this.$$offset,
        syncId: sync.id
    };
};

PhysicalLayer.prototype.getRxSync = function () {
    var sync = this.$$syncCodeDetector.getSync();

    return {
        id: sync.id,
        symbolSamplingPointOffset: sync.symbolSamplingPointOffset,
        correlationValue: sync.correlationValue,
        signalDecibelAverage: sync.signalDecibelAverage,
        noiseDecibelAverage: sync.noiseDecibelAverage,
        signalToNoiseRatio: sync.signalToNoiseRatio
    };
};

PhysicalLayer.prototype.getRxConfig = function () {
    var symbolFrequencySpacing = this.$$getFrequency(
        PhysicalLayer.$$_FIRST_SYMBOL,
        this.$$rxSampleRate
    );

    return {
        sampleRate: this.$$rxSampleRate,
        symbolFrequencySpacing: symbolFrequencySpacing,
        symbolMin: this.$$rxSymbolMin,
        symbolMax: this.$$rxSymbolMax,
        signalDecibelThreshold: this.$$signalDecibelThreshold,
        signalDecibelThresholdFactor: this.$$signalDecibelThresholdFactor
    };
};

PhysicalLayer.prototype.getConfig = function () {
    return {
        fftSkipFactor: this.$$fftSkipFactor,
        fftSize: this.$$fftSize,
        samplePerSymbol: this.$$samplePerSymbol,
        unitTime: this.$$unitTime,
        correlationCodeLength: this.$$syncCode.length,
        isLoopbackEnabled: this.$$audioMonoIO.isLoopbackEnabled()
    };
};

PhysicalLayer.prototype.getTx = function () {
    return {
        symbol: this.$$txSymbol,
        symbolQueue: this.$$txSymbolQueue.slice(0)
    }
};

PhysicalLayer.prototype.getTxConfig = function () {
    var symbolFrequencySpacing = this.$$getFrequency(
        PhysicalLayer.$$_FIRST_SYMBOL,
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

PhysicalLayer.prototype.$$smartTimerListener = function () {
    if (this.$$firstSmartTimerCall) {
        this.$$rxConfigListener ? this.$$rxConfigListener(this.getRxConfig()) : undefined;
        this.$$configListener ? this.$$configListener(this.getConfig()) : undefined;
        this.$$txConfigListener ? this.$$txConfigListener(this.getTxConfig()) : undefined;
    }

    this.$$sampleId++;

    this.$$offset = this.$$sampleNumber % this.$$samplePerSymbol;
    this.$$rx();
    this.$$tx();

    this.$$sampleNumber++;

    this.$$firstSmartTimerCall = false;
};

PhysicalLayer.prototype.$$rx = function () {
    var
        isAllowedToListen,
        fftResult,
        sync,
        isNewSyncAvailable = false,
        isNewSymbolReadyToTake;

    isAllowedToListen =
        this.$$txSymbol === PhysicalLayer.$$_SYMBOL_IDLE ||
        this.$$audioMonoIO.isLoopbackEnabled();

    if (isAllowedToListen) {
        fftResult = new FFTResult(this.$$audioMonoIO.getFrequencyData(), this.$$rxSampleRate);
        fftResult.downconvert(this.$$fftSkipFactor);
        this.$$frequencyData = fftResult.getFrequencyData();
        this.$$symbolRaw = fftResult.getLoudestBinIndexInBinRange(this.$$rxSymbolMin, this.$$rxSymbolMax);
        this.$$signalDecibel = fftResult.getDecibel(this.$$symbolRaw);
        this.$$signalDecibelNextCandidate = -Infinity; // TODO add this
        this.$$noiseDecibel = fftResult.getDecibelAverage(this.$$rxSymbolMin, this.$$rxSymbolMax, this.$$symbolRaw);
    } else {
        this.$$frequencyData = [];
        this.$$symbolRaw = this.$$rxSymbolMin;
        this.$$signalDecibel = -Infinity;
        this.$$signalDecibelNextCandidate = -Infinity;
        this.$$noiseDecibel = -Infinity;
    }

    this.$$handleSyncCode();

    this.$$isSyncInProgress = this.$$syncCodeDetector.isSyncInProgress();
    sync = this.$$syncCodeDetector.getSync();
    if (sync.id && sync.id !== this.$$syncLastId) {
        this.$$signalDecibelThreshold = sync.noiseDecibelAverage +
            this.$$signalDecibelThresholdFactor * sync.signalToNoiseRatio;
        this.$$syncLastId = sync.id;
        isNewSyncAvailable = true;
    }

    this.$$isSymbolSamplingPoint = sync.id && this.$$offset === sync.symbolSamplingPointOffset;
    isNewSymbolReadyToTake = this.$$isSymbolSamplingPoint && this.$$signalDecibel > this.$$signalDecibelThreshold;
    this.$$symbol = isNewSymbolReadyToTake ? this.$$symbolRaw : PhysicalLayer.$$_SYMBOL_IDLE;

    // call listeners
    if (isNewSyncAvailable) {
        this.$$rxSyncListener ? this.$$rxSyncListener(this.getRxSync()) : undefined;
        this.$$rxConfigListener ? this.$$rxConfigListener(this.getRxConfig()) : undefined;
    }
    this.$$rxSampleListener ? this.$$rxSampleListener(this.getRxSample()) : undefined;
    if (this.$$isSymbolSamplingPoint) {
        this.$$symbolId++;
        this.$$rxSymbolListener ? this.$$rxSymbolListener(this.getRxSymbol()) : undefined;
    }
};

PhysicalLayer.prototype.$$tx = function () {
    var
        newSymbolReady,
        isFirstSampleOfBlock = this.$$offset === 0;

    if (isFirstSampleOfBlock) {
        newSymbolReady = this.$$txSymbolQueue.length > 0;
        this.$$txSymbol = newSymbolReady
            ? this.$$txSymbolQueue.shift()
            : PhysicalLayer.$$_SYMBOL_IDLE;
        this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
    }
    this.$$updateOscillator();
};

// -------

PhysicalLayer.prototype.$$handleSyncCode = function () {
    var codeValue = null;

    switch (this.$$symbolRaw) {
        case this.$$rxSymbolMax - PhysicalLayer.$$_SYNC_SYMBOL_A_OFFSET:
            codeValue = -1;
            break;
        case this.$$rxSymbolMax - PhysicalLayer.$$_SYNC_SYMBOL_B_OFFSET:
            codeValue = 1;
            break;
    }
    this.$$syncCodeDetector.handle(
        codeValue, this.$$signalDecibel, this.$$noiseDecibel
    );
};

PhysicalLayer.prototype.$$getSymbolMin = function (sampleRate) {
    switch (sampleRate) {
        case 44100:
            return this.$$symbolMin44100;
        case 48000:
            return this.$$symbolMin48000;
        default:
            return this.$$symbolMinDefault;
    }
};

PhysicalLayer.prototype.$$getSymbolMax = function (sampleRate) {
    var symbolMin = this.$$getSymbolMin(sampleRate);
    
    return symbolMin + this.$$symbolRange - 1;
};

PhysicalLayer.prototype.$$updateOscillator = function () {
    var frequency, amplitude;

    if (this.$$txSymbol === PhysicalLayer.$$_SYMBOL_IDLE) {
        frequency = PhysicalLayer.$$_SYMBOL_IDLE;
        amplitude = PhysicalLayer.$$_TX_AMPLITUDE_SILENT;
    } else {
        frequency = this.$$getFrequency(this.$$txSymbol, this.$$txSampleRate);
        amplitude = this.$$amplitude;
    }

    this.$$audioMonoIO.setPeriodicWave(frequency, amplitude);
};

PhysicalLayer.prototype.$$getFrequency = function (symbol, sampleRate) {
    var nativeFrequency = FFTResult.getFrequency(symbol, sampleRate, this.$$fftSize);

    return this.$$fftSkipFactor * nativeFrequency;
};

PhysicalLayer.$$isFunction = function (variable) {
    return typeof variable === 'function';
};
