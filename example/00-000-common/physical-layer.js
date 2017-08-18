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
    this._signalDecibelThresholdFactor = 0.6;

    this._rxSymbolListener = undefined;
    this._rxSampleListener = undefined;
    this._rxSyncListener = undefined;
    this._rxConfigListener = undefined;
    this._configListener = undefined;
    this._txListener = undefined;
    this._txConfigListener = undefined;
};

PhysicalLayerV2Builder.prototype.fftSize = function (fftSize) {
    this._fftSize = fftSize;
    return this;
};

PhysicalLayerV2Builder.prototype.unitTime = function (unitTime) {
    this._unitTime = unitTime;
    return this;
};

PhysicalLayerV2Builder.prototype.fftSkipFactor = function (fftSkipFactor) {
    this._fftSkipFactor = fftSkipFactor;
    return this;
};

PhysicalLayerV2Builder.prototype.samplePerSymbol = function (samplePerSymbol) {
    this._samplePerSymbol = samplePerSymbol;
    return this;
};

PhysicalLayerV2Builder.prototype.symbolMin44100 = function (symbolMin44100) {
    this._symbolMin44100 = symbolMin44100;
    return this;
};

PhysicalLayerV2Builder.prototype.symbolMin48000 = function (symbolMin48000) {
    this._symbolMin48000 = symbolMin48000;
    return this;
};

PhysicalLayerV2Builder.prototype.symbolMinDefault = function (symbolMinDefault) {
    this._symbolMinDefault = symbolMinDefault;
    return this;
};

PhysicalLayerV2Builder.prototype.symbolRange = function (symbolRange) {
    this._symbolRange = symbolRange;
    return this;
};

PhysicalLayerV2Builder.prototype.amplitude = function (amplitude) {
    this._amplitude = amplitude;
    return this;
};

PhysicalLayerV2Builder.prototype.rxSymbolListener = function (listener) {
    this._rxSymbolListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.rxSampleListener = function (listener) {
    this._rxSampleListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.rxSyncListener = function (listener) {
    this._rxSyncListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.rxConfigListener = function (listener) {
    this._rxConfigListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.configListener = function (listener) {
    this._configListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.txListener = function (listener) {
    this._txListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.txConfigListener = function (listener) {
    this._txConfigListener = listener;
    return this;
};

PhysicalLayerV2Builder.prototype.build = function () {
    return new PhysicalLayerV2(this);
};

// -----------------------------------------------------------------------------------------

var PhysicalLayerV2;

PhysicalLayerV2 = function (builder) {
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
    this.$$sampleNumber = PhysicalLayerV2.$$_INITIAL_SAMPLE_NUMER;
    this.$$offset = undefined;
    this.$$symbolId = PhysicalLayerV2.$$_INITIAL_ID;
    this.$$sampleId = PhysicalLayerV2.$$_INITIAL_ID;
    this.$$symbol = undefined;
    this.$$symbolRaw = undefined;
    this.$$signalDecibel = undefined;
    this.$$signalDecibelNextCandidate = undefined;
    this.$$noiseDecibel = undefined;
    this.$$frequencyData = undefined;
    this.$$isSyncInProgress = undefined;
    this.$$isSymbolSamplingPoint = undefined;
    this.$$signalDecibelThreshold = PhysicalLayerV2.$$_INITIAL_SIGNAL_DECIBEL_THRESHOLD;
    this.$$syncLastId = undefined;
    this.$$txSymbol = PhysicalLayerV2.$$_SYMBOL_IDLE;
    this.$$txSymbolQueue = [];

    // symbol ranges depends on sampleRate
    this.$$rxSymbolMin = this.$$getSymbolMin(this.$$rxSampleRate);
    this.$$rxSymbolMax = this.$$getSymbolMax(this.$$rxSampleRate);
    this.$$txSampleRate = undefined;
    this.$$txSymbolMin = undefined;
    this.$$txSymbolMax = undefined;
    this.setTxSampleRate(builder._txSampleRate);

    // setup listeners
    this.$$rxSymbolListener = PhysicalLayerV2.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
    this.$$rxSampleListener = PhysicalLayerV2.$$isFunction(builder._rxSampleListener) ? builder._rxSampleListener : null;
    this.$$rxSyncListener = PhysicalLayerV2.$$isFunction(builder._rxSyncListener) ? builder._rxSyncListener : null;
    this.$$rxConfigListener = PhysicalLayerV2.$$isFunction(builder._rxConfigListener) ? builder._rxConfigListener : null;
    this.$$configListener = PhysicalLayerV2.$$isFunction(builder._configListener) ? builder._configListener : null;
    this.$$txListener = PhysicalLayerV2.$$isFunction(builder._txListener) ? builder._txListener : null;
    this.$$txConfigListener = PhysicalLayerV2.$$isFunction(builder._txConfigListener) ? builder._txConfigListener : null;

    this.$$firstSmartTimerCall = true;
};

PhysicalLayerV2.$$_INITIAL_SAMPLE_NUMER = 0;
PhysicalLayerV2.$$_INITIAL_ID = 0;   // will be incremented BEFORE first use
PhysicalLayerV2.$$_INITIAL_SIGNAL_DECIBEL_THRESHOLD = +Infinity;
PhysicalLayerV2.$$_SYMBOL_IDLE = null;
PhysicalLayerV2.$$_TX_AMPLITUDE_SILENT = 0;
PhysicalLayerV2.$$_FIRST_SYMBOL = 1;
PhysicalLayerV2.$$_SYNC_SYMBOL_A_OFFSET = 1;
PhysicalLayerV2.$$_SYNC_SYMBOL_B_OFFSET = 0;
PhysicalLayerV2.SYMBOL_IS_NOT_VALID_EXCEPTION = 'Symbol is not valid. Please pass number that is inside symbol range.';

// -----------------------------------------

PhysicalLayerV2.prototype.sendSyncCode = function () {
    var i, codeValue, symbol;

    for (i = 0; i < this.$$syncCode.length; i++) {
        codeValue = this.$$syncCode[i];
        symbol = codeValue === -1
            ? this.$$txSymbolMax - PhysicalLayerV2.$$_SYNC_SYMBOL_A_OFFSET
            : this.$$txSymbolMax - PhysicalLayerV2.$$_SYNC_SYMBOL_B_OFFSET;
        this.$$txSymbolQueue.push(symbol);
    }
    this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
};

PhysicalLayerV2.prototype.sendSymbol = function (symbol) {
    var isNumber, symbolParsed, inRange, isValid;

    if (symbol === PhysicalLayerV2.$$_SYMBOL_IDLE) {
        this.$$txSymbolQueue.push(PhysicalLayerV2.$$_SYMBOL_IDLE);
    } else {
        symbolParsed = parseInt(symbol);
        isNumber = typeof symbolParsed === 'number';
        inRange = this.$$txSymbolMin <= symbolParsed && symbolParsed <= this.$$txSymbolMax;
        isValid = isNumber && inRange;

        if (!isValid) {
            throw PhysicalLayerV2.SYMBOL_IS_NOT_VALID_EXCEPTION;
        }

        this.$$txSymbolQueue.push(symbolParsed);
    }
    this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
};

PhysicalLayerV2.prototype.setTxSampleRate = function (txSampleRate) {
    this.$$txSampleRate = txSampleRate;
    this.$$txSymbolMin = this.$$getSymbolMin(this.$$txSampleRate);
    this.$$txSymbolMax = this.$$getSymbolMax(this.$$txSampleRate);
    this.$$txSymbolQueue.length = 0;
    this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
    this.$$txConfigListener ? this.$$txConfigListener(this.getTxConfig()) : undefined;
};

PhysicalLayerV2.prototype.setLoopback = function (state) {
    this.$$audioMonoIO.setLoopback(state);
    this.$$configListener ? this.$$configListener(this.getConfig()) : undefined;
};

PhysicalLayerV2.prototype.setAmplitude = function (amplitude) {
    this.$$amplitude = amplitude;
    this.$$txConfigListener ? this.$$txConfigListener(this.getTxConfig()) : undefined;
};

PhysicalLayerV2.prototype.clearQueue = function () {
    this.$$txSymbolQueue.length = 0;
    this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
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
        symbolRaw: this.$$symbolRaw,
        signalDecibel: this.$$signalDecibel,
        signalDecibelNextCandidate: this.$$signalDecibelNextCandidate,
        noiseDecibel: this.$$noiseDecibel,
        frequencyData: this.$$frequencyData.slice(0),
        isSyncInProgress: this.$$isSyncInProgress,
        isSymbolSamplingPoint: this.$$isSymbolSamplingPoint,
        sampleNumber: this.$$sampleNumber,
        offset: this.$$offset,
        syncId: sync.id
    };
};

PhysicalLayerV2.prototype.getRxSync = function () {
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
        signalDecibelThreshold: this.$$signalDecibelThreshold,
        signalDecibelThresholdFactor: this.$$signalDecibelThresholdFactor
    };
};

PhysicalLayerV2.prototype.getConfig = function () {
    return {
        fftSkipFactor: this.$$fftSkipFactor,
        fftSize: this.$$fftSize,
        samplePerSymbol: this.$$samplePerSymbol,
        unitTime: this.$$unitTime,
        correlationCodeLength: this.$$syncCode.length,
        isLoopbackEnabled: this.$$audioMonoIO.isLoopbackEnabled()
    };
};

PhysicalLayerV2.prototype.getTx = function () {
    return {
        symbol: this.$$txSymbol,
        symbolQueue: this.$$txSymbolQueue.slice(0)
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
    if (this.$$firstSmartTimerCall) {
        this.$$rxConfigListener ? this.$$rxConfigListener(this.getRxConfig()) : undefined;
        this.$$configListener ? this.$$configListener(this.getConfig()) : undefined;
        this.$$txConfigListener ? this.$$txConfigListener(this.getTxConfig()) : undefined;
    }

    this.$$offset = this.$$sampleNumber % this.$$samplePerSymbol;
    this.$$rx();
    this.$$tx();

    this.$$sampleNumber++;
    this.$$sampleId++;

    this.$$firstSmartTimerCall = false;
};

PhysicalLayerV2.prototype.$$rx = function () {
    var
        isAllowedToListen,
        fftResult,
        sync,
        isNewSyncAvailable = false,
        isNewSymbolReadyToTake;

    isAllowedToListen =
        this.$$txSymbol === PhysicalLayerV2.$$_SYMBOL_IDLE ||
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

    this.$$isSymbolSamplingPoint = !!(sync.id && this.$$offset === sync.symbolSamplingPointOffset);
    isNewSymbolReadyToTake = this.$$isSymbolSamplingPoint && this.$$signalDecibel > this.$$signalDecibelThreshold;
    this.$$symbol = isNewSymbolReadyToTake ? this.$$symbolRaw : PhysicalLayerV2.$$_SYMBOL_IDLE;

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

PhysicalLayerV2.prototype.$$tx = function () {
    var
        newSymbolReady,
        isFirstSampleOfBlock = this.$$offset === 0;

    if (isFirstSampleOfBlock) {
        newSymbolReady = this.$$txSymbolQueue.length > 0;
        this.$$txSymbol = newSymbolReady
            ? this.$$txSymbolQueue.shift()
            : PhysicalLayerV2.$$_SYMBOL_IDLE;
        this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
    }
    this.$$updateOscillator();
};

// -------

PhysicalLayerV2.prototype.$$handleSyncCode = function () {
    var codeValue;

    switch (this.$$symbolRaw) {
        case this.$$rxSymbolMax - PhysicalLayerV2.$$_SYNC_SYMBOL_A_OFFSET:
            codeValue = -1;
            break;
        case this.$$rxSymbolMax - PhysicalLayerV2.$$_SYNC_SYMBOL_B_OFFSET:
            codeValue = 1;
            break;
    }
    this.$$syncCodeDetector.handle(
        codeValue, this.$$signalDecibel, this.$$noiseDecibel
    );
};

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

    if (this.$$txSymbol === PhysicalLayerV2.$$_SYMBOL_IDLE) {
        frequency = PhysicalLayerV2.$$_SYMBOL_IDLE;
        amplitude = PhysicalLayerV2.$$_TX_AMPLITUDE_SILENT;
    } else {
        frequency = this.$$getFrequency(this.$$txSymbol, this.$$txSampleRate);
        amplitude = this.$$amplitude;
    }

    this.$$audioMonoIO.setPeriodicWave(frequency, amplitude);
};

PhysicalLayerV2.prototype.$$getFrequency = function (symbol, sampleRate) {
    var nativeFrequency = FFTResult.getFrequency(symbol, sampleRate, this.$$fftSize);

    return this.$$fftSkipFactor * nativeFrequency;
};

PhysicalLayerV2.$$isFunction = function (variable) {
    return typeof variable === 'function';
};
