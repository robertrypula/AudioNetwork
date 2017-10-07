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
    this._rxDspConfigListener = undefined;
    this._dspConfigListener = undefined;
    this._txListener = undefined;
    this._txDspConfigListener = undefined;
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

PhysicalLayerBuilder.prototype.rxDspConfigListener = function (listener) {
    this._rxDspConfigListener = listener;
    return this;
};

PhysicalLayerBuilder.prototype.dspConfigListener = function (listener) {
    this._dspConfigListener = listener;
    return this;
};

PhysicalLayerBuilder.prototype.txListener = function (listener) {
    this._txListener = listener;
    return this;
};

PhysicalLayerBuilder.prototype.txDspConfigListener = function (listener) {
    this._txDspConfigListener = listener;
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
    this.$$rxDspConfigListener = PhysicalLayer.$$isFunction(builder._rxDspConfigListener) ? builder._rxDspConfigListener : null;
    this.$$dspConfigListener = PhysicalLayer.$$isFunction(builder._dspConfigListener) ? builder._dspConfigListener : null;
    this.$$txListener = PhysicalLayer.$$isFunction(builder._txListener) ? builder._txListener : null;
    this.$$txDspConfigListener = PhysicalLayer.$$isFunction(builder._txDspConfigListener) ? builder._txDspConfigListener : null;

    this.$$firstSmartTimerCall = true;
};

PhysicalLayer.$$_INITIAL_SAMPLE_NUMER = 0;
PhysicalLayer.$$_INITIAL_ID = 0;   // will be incremented BEFORE first use
PhysicalLayer.$$_INITIAL_SIGNAL_DECIBEL_THRESHOLD = +Infinity;
PhysicalLayer.$$_SYMBOL_IDLE = null;
PhysicalLayer.$$_SYMBOL_GAP = -1;
PhysicalLayer.$$_SYMBOL_GAP_IMPORTANT = -2;
PhysicalLayer.$$_TX_AMPLITUDE_SILENT = 0;
PhysicalLayer.$$_TX_FREQUENCY_ZERO = 0;
PhysicalLayer.$$_FIRST_SYMBOL = 1;
PhysicalLayer.$$_SYNC_SYMBOL_A_OFFSET = 1;
PhysicalLayer.$$_SYNC_SYMBOL_B_OFFSET = 0;
PhysicalLayer.SYMBOL_IS_NOT_VALID_EXCEPTION = 'Symbol is not valid. Please pass number that is inside symbol range.';

// -----------------------------------------

PhysicalLayer.prototype.getRxSampleRate = function () {
    var rxDspConfig = this.getRxDspConfig();

    return rxDspConfig.sampleRate;
};

PhysicalLayer.prototype.sendSync = function () {
    var i, codeValue, symbol;

    this.$$handleGapLogic();

    for (i = 0; i < this.$$syncCode.length; i++) {
        codeValue = this.$$syncCode[i];
        symbol = codeValue === -1
            ? this.$$txSymbolMax - PhysicalLayer.$$_SYNC_SYMBOL_A_OFFSET
            : this.$$txSymbolMax - PhysicalLayer.$$_SYNC_SYMBOL_B_OFFSET;
        this.$$txSymbolQueue.push(symbol);
    }

    // TODO actually it should take into account the Correlator.THRESHOLD_UNIT value
    for (i = 0; i < Math.ceil(this.$$syncCode.length / 2) + 1; i++) {
        this.$$txSymbolQueue.push(PhysicalLayer.$$_SYMBOL_GAP_IMPORTANT);
    }

    this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
};

PhysicalLayer.prototype.sendSymbol = function (symbol) {
    var isNumber, symbolParsed, inRange, isValid;

    this.$$handleGapLogic();

    symbolParsed = parseInt(symbol);
    isNumber = typeof symbolParsed === 'number';
    inRange = this.$$txSymbolMin <= symbolParsed && symbolParsed <= this.$$txSymbolMax;
    isValid = isNumber && inRange;

    if (!isValid) {
        throw PhysicalLayer.SYMBOL_IS_NOT_VALID_EXCEPTION;
    }

    this.$$txSymbolQueue.push(symbolParsed);
    this.$$txSymbolQueue.push(PhysicalLayer.$$_SYMBOL_GAP);     // will be removed if subsequent symbol will arrive

    this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
};

PhysicalLayer.prototype.setTxSampleRate = function (txSampleRate) {
    this.$$txSampleRate = txSampleRate;
    this.$$txSymbolMin = this.$$getSymbolMin(this.$$txSampleRate);
    this.$$txSymbolMax = this.$$getSymbolMax(this.$$txSampleRate);
    this.$$txSymbolQueue.length = 0;
    this.$$txListener ? this.$$txListener(this.getTx()) : undefined;
    this.$$txDspConfigListener ? this.$$txDspConfigListener(this.getTxDspConfig()) : undefined;
};

PhysicalLayer.prototype.setLoopback = function (state) {
    this.$$audioMonoIO.setLoopback(state);
    this.$$dspConfigListener ? this.$$dspConfigListener(this.getDspConfig()) : undefined;
};

PhysicalLayer.prototype.setAmplitude = function (amplitude) {
    this.$$amplitude = amplitude;
    this.$$txDspConfigListener ? this.$$txDspConfigListener(this.getTxDspConfig()) : undefined;
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

PhysicalLayer.prototype.getRxDspConfig = function () {
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

PhysicalLayer.prototype.getDspConfig = function () {
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
        symbolQueue: this.$$txSymbolQueue.slice(0),
        isTxBusy:
            this.$$txSymbolQueue.length > 0 ||
            this.$$txSymbol !== PhysicalLayer.$$_SYMBOL_IDLE
    }
};

PhysicalLayer.prototype.getTxDspConfig = function () {
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

PhysicalLayer.prototype.$$handleGapLogic = function () {
    var tx, i;

    // When device A sends some data to device B
    // then device B cannot respond immediately. We
    // need make sure that device A will have some time
    // to reinitialize microphone again. This is solved
    // by adding two 'gap' symbols in the beggining
    // Similar problem we have at the end. If we enable
    // microphone at the same time as last symbol stops
    // then we have a glitch. We need to add one 'gap'
    // symbol after the last symbol.
    // If symbol is not last we need to remove that
    // unnessescary gap.
    tx = this.getTx();
    if (!tx.isTxBusy) {
        this.$$txSymbolQueue.push(PhysicalLayer.$$_SYMBOL_GAP);
        this.$$txSymbolQueue.push(PhysicalLayer.$$_SYMBOL_GAP);
    } else {
        for (i = this.$$txSymbolQueue.length - 1; i >= 0; i--) {
            if (this.$$txSymbolQueue[i] !== PhysicalLayer.$$_SYMBOL_GAP) {
                this.$$txSymbolQueue.length = i + 1;
                break;
            }
        }
    }
};

PhysicalLayer.prototype.$$smartTimerListener = function () {
    if (this.$$firstSmartTimerCall) {
        this.$$rxDspConfigListener ? this.$$rxDspConfigListener(this.getRxDspConfig()) : undefined;
        this.$$dspConfigListener ? this.$$dspConfigListener(this.getDspConfig()) : undefined;
        this.$$txDspConfigListener ? this.$$txDspConfigListener(this.getTxDspConfig()) : undefined;
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
        isNewSymbolReadyToTake,
        fakeFrequencyData,
        i;

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
        fakeFrequencyData = [];
        for (i = 0; i < this.$$fftSize * 0.5; i++) {
            fakeFrequencyData.push(-160);
        }
        fftResult = new FFTResult(fakeFrequencyData, this.$$rxSampleRate);
        fftResult.downconvert(this.$$fftSkipFactor);
        this.$$frequencyData = fftResult.getFrequencyData();
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
        this.$$rxDspConfigListener ? this.$$rxDspConfigListener(this.getRxDspConfig()) : undefined;
    }
    this.$$rxSampleListener ? this.$$rxSampleListener(this.getRxSample()) : undefined;
    if (this.$$isSymbolSamplingPoint) {
        this.$$symbolId++;
        this.$$rxSymbolListener ? this.$$rxSymbolListener(this.getRxSymbol()) : undefined;
    }
};

PhysicalLayer.prototype.$$tx = function () {
    var
        isFirstSampleOfBlock = this.$$offset === 0,
        txJustStarted = false,
        txJustEnded = false,
        newSymbolReady,
        txSymbolPrevious;

    if (isFirstSampleOfBlock) {
        newSymbolReady = this.$$txSymbolQueue.length > 0;

        txSymbolPrevious = this.$$txSymbol;
        txJustStarted =
            this.$$txSymbol === PhysicalLayer.$$_SYMBOL_IDLE &&
            newSymbolReady;

        this.$$txSymbol = newSymbolReady
            ? this.$$txSymbolQueue.shift()
            : PhysicalLayer.$$_SYMBOL_IDLE;

        txJustEnded =
            txSymbolPrevious !== PhysicalLayer.$$_SYMBOL_IDLE &&
            this.$$txSymbol === PhysicalLayer.$$_SYMBOL_IDLE;

        this.$$txListener ? this.$$txListener(this.getTx()) : undefined;

        if (txJustStarted) {
            this.$$audioMonoIO.microphoneDisable(); // TODO experimental feature, this solves volume controll problem on mobile browsers
            // console.log('microphone disable');
        }
        if (txJustEnded) {
            this.$$audioMonoIO.microphoneEnable();  // TODO experimental feature, this solves volume controll problem on mobile browsers
            // console.log('microphone enable');
        }

        this.$$updateOscillator();

        // console.log('-----');
    }
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
    var frequency, amplitude, isSymbolSpecial;

    isSymbolSpecial =
        this.$$txSymbol === PhysicalLayer.$$_SYMBOL_IDLE ||
        this.$$txSymbol === PhysicalLayer.$$_SYMBOL_GAP ||
        this.$$txSymbol === PhysicalLayer.$$_SYMBOL_GAP_IMPORTANT;

    if (isSymbolSpecial) {
        frequency = PhysicalLayer.$$_TX_FREQUENCY_ZERO;
        amplitude = PhysicalLayer.$$_TX_AMPLITUDE_SILENT;
    } else {
        frequency = this.$$getFrequency(this.$$txSymbol, this.$$txSampleRate);
        amplitude = this.$$amplitude;
    }

    /*
    console.log(
        'setPeriodicWave', frequency, amplitude,
        this.$$txSymbol === PhysicalLayer.$$_SYMBOL_IDLE ? 'IDLE' : '',
        this.$$txSymbol === PhysicalLayer.$$_SYMBOL_GAP ? 'GAP' : '',
        this.$$txSymbol === PhysicalLayer.$$_SYMBOL_GAP_IMPORTANT ? 'GAP IMPORTANT' : ''
    );
    */
    this.$$audioMonoIO.setPeriodicWave(frequency, amplitude);
};

PhysicalLayer.prototype.$$getFrequency = function (symbol, sampleRate) {
    var nativeFrequency = FFTResult.getFrequency(symbol, sampleRate, this.$$fftSize);

    return this.$$fftSkipFactor * nativeFrequency;
};

PhysicalLayer.$$isFunction = function (variable) {
    return typeof variable === 'function';
};
