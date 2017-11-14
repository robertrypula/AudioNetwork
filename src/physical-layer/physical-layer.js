// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// TODO refactor needed - move data returned by listeners to separate classes

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.PhysicalLayer.PhysicalLayer', PhysicalLayer);

    PhysicalLayer.$inject = [
        'Rewrite.WebAudio.AudioMonoIO',
        'Rewrite.Util.SmartTimer',
        'Rewrite.PhysicalLayer.RxSyncDetector',
        'Rewrite.Dsp.FFTResult',
        'Rewrite.PhysicalLayer.TxSymbolManager'
    ];

    function PhysicalLayer(
        AudioMonoIO,
        SmartTimer,
        RxSyncDetector,
        FFTResult,
        TxSymbolManager
    ) {
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
            this.$$txAmplitude = builder._txAmplitude;
            this.$$correlationCode = builder._correlationCode.slice(0);
            this.$$rxSyncDetector = new RxSyncDetector(this.$$samplePerSymbol, this.$$correlationCode);
            this.$$rxSignalDecibelThresholdFactor = builder._rxSignalDecibelThresholdFactor;

            // state variables
            this.$$sampleNumber = PhysicalLayer.$$_INITIAL_SAMPLE_NUMER;
            this.$$sampleOffset = undefined;
            this.$$rxSymbolId = PhysicalLayer.$$_INITIAL_ID;
            this.$$rxSampleDspDetailsId = PhysicalLayer.$$_INITIAL_ID;
            this.$$rxSyncStatusId = PhysicalLayer.$$_INITIAL_ID;
            this.$$rxSymbol = undefined;
            this.$$rxSymbolRaw = undefined;
            this.$$rxSignalDecibel = undefined;
            this.$$rxSignalDecibelNextCandidate = undefined;
            this.$$rxNoiseDecibel = undefined;
            this.$$rxFrequencyData = undefined;
            this.$$isRxSyncInProgress = undefined;
            this.$$isRxSymbolSamplingPoint = undefined;
            this.$$rxSignalDecibelThreshold = PhysicalLayer.$$_INITIAL_RX_SIGNAL_DECIBEL_THRESHOLD;
            this.$$rxSyncDspDetailsLastId = undefined;
            this.$$txSymbolManager = new TxSymbolManager();

            // symbol ranges depends on sampleRate
            this.$$rxSymbolMin = this.$$getSymbolMin(this.$$rxSampleRate);
            this.$$rxSymbolMax = this.$$getSymbolMax(this.$$rxSampleRate);
            this.$$txSampleRate = undefined;
            this.$$txSymbolMin = undefined;
            this.$$txSymbolMax = undefined;
            this.setTxSampleRate(builder._txSampleRate);

            // setup listeners
            this.$$rxSymbolListener = PhysicalLayer.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
            this.$$rxSyncStatusListener = PhysicalLayer.$$isFunction(builder._rxSyncStatusListener) ? builder._rxSyncStatusListener : null;
            this.$$rxSampleDspDetailsListener = PhysicalLayer.$$isFunction(builder._rxSampleDspDetailsListener) ? builder._rxSampleDspDetailsListener : null;
            this.$$rxSyncDspDetailsListener = PhysicalLayer.$$isFunction(builder._rxSyncDspDetailsListener) ? builder._rxSyncDspDetailsListener : null;
            this.$$rxDspConfigListener = PhysicalLayer.$$isFunction(builder._rxDspConfigListener) ? builder._rxDspConfigListener : null;
            this.$$dspConfigListener = PhysicalLayer.$$isFunction(builder._dspConfigListener) ? builder._dspConfigListener : null;
            this.$$txSymbolListener = PhysicalLayer.$$isFunction(builder._txSymbolListener) ? builder._txSymbolListener : null;
            this.$$txSymbolProgressListener = PhysicalLayer.$$isFunction(builder._txSymbolProgressListener) ? builder._txSymbolProgressListener : null;
            this.$$txDspConfigListener = PhysicalLayer.$$isFunction(builder._txDspConfigListener) ? builder._txDspConfigListener : null;

            this.$$firstSmartTimerCall = true;
        };

        PhysicalLayer.MICROPHONE_MODE_ALWAYS_ON = 0;
        PhysicalLayer.MICROPHONE_MODE_AUTO_ON_OFF_WITH_GAP = 1;
        PhysicalLayer.$$_INITIAL_SAMPLE_NUMER = 0;
        PhysicalLayer.$$_INITIAL_ID = 0;   // will be incremented BEFORE first use
        PhysicalLayer.$$_INITIAL_RX_SIGNAL_DECIBEL_THRESHOLD = +Infinity;
        PhysicalLayer.$$_TX_AMPLITUDE_SILENT = 0;
        PhysicalLayer.$$_TX_FREQUENCY_ZERO = 0;
        PhysicalLayer.$$_FIRST_SYMBOL = 1;
        PhysicalLayer.$$_SYMBOL_SYNC_A_OFFSET = 1;
        PhysicalLayer.$$_SYMBOL_SYNC_B_OFFSET = 0;
        PhysicalLayer.$$_RX_SYMBOL_IDLE = null;
        PhysicalLayer.SYMBOL_IS_NOT_VALID_EXCEPTION = 'Symbol is not valid. Please pass number that is inside symbol range.';

        // -----------------------------------------

        PhysicalLayer.prototype.getRxSampleRate = function () {
            var rxDspConfig = this.getRxDspConfig();

            return rxDspConfig.rxSampleRate;
        };

        PhysicalLayer.prototype.txSync = function () {
            var i, correlationCodeValue, txFskSymbol, halfPlusOne;

            this.$$txSymbolManager.handleGapLogicAtStart();

            for (i = 0; i < this.$$correlationCode.length; i++) {
                correlationCodeValue = this.$$correlationCode[i];
                txFskSymbol = correlationCodeValue === -1
                    ? this.$$txSymbolMax - PhysicalLayer.$$_SYMBOL_SYNC_A_OFFSET
                    : this.$$txSymbolMax - PhysicalLayer.$$_SYMBOL_SYNC_B_OFFSET;
                this.$$txSymbolManager.addTxFskSymbol(txFskSymbol);
            }

            // TODO actually it should take into account the Correlator.THRESHOLD_UNIT value
            halfPlusOne = Math.ceil(this.$$correlationCode.length / 2) + 1;
            this.$$txSymbolManager.handleGapLogicAtEndOfSync(halfPlusOne);

            this.$$txSymbolProgressListener ? this.$$txSymbolProgressListener(this.getTxSymbolProgress()) : undefined;
        };

        PhysicalLayer.prototype.txSymbol = function (txSymbol) {
            var isNumber, txFskSymbolParsed, inRange, isValid, id;

            this.$$txSymbolManager.handleGapLogicAtStart();

            txFskSymbolParsed = parseInt(txSymbol);
            isNumber = typeof txFskSymbolParsed === 'number';
            inRange = this.$$txSymbolMin <= txFskSymbolParsed && txFskSymbolParsed <= this.$$txSymbolMax;
            isValid = isNumber && inRange;

            if (!isValid) {
                throw PhysicalLayer.SYMBOL_IS_NOT_VALID_EXCEPTION;
            }

            id = this.$$txSymbolManager.addTxFskSymbol(txFskSymbolParsed);

            this.$$txSymbolManager.handleGapLogicAtEnd();

            this.$$txSymbolProgressListener ? this.$$txSymbolProgressListener(this.getTxSymbolProgress()) : undefined;

            return id;
        };

        PhysicalLayer.prototype.setTxSampleRate = function (txSampleRate) {
            this.$$txSampleRate = txSampleRate;
            this.$$txSymbolMin = this.$$getSymbolMin(this.$$txSampleRate);
            this.$$txSymbolMax = this.$$getSymbolMax(this.$$txSampleRate);
            this.$$txSymbolManager.clearTxSymbolQueue();
            this.$$txSymbolProgressListener ? this.$$txSymbolProgressListener(this.getTxSymbolProgress()) : undefined;
            this.$$txDspConfigListener ? this.$$txDspConfigListener(this.getTxDspConfig()) : undefined;
        };

        PhysicalLayer.prototype.setLoopback = function (state) {
            this.$$audioMonoIO.setLoopback(state);
            this.$$dspConfigListener ? this.$$dspConfigListener(this.getDspConfig()) : undefined;
        };

        PhysicalLayer.prototype.setTxAmplitude = function (txAmplitude) {
            this.$$txAmplitude = txAmplitude;
            this.$$txDspConfigListener ? this.$$txDspConfigListener(this.getTxDspConfig()) : undefined;
        };

        // -----------------------------------------

        PhysicalLayer.prototype.getRxSymbol = function () {
            return {
                id: this.$$rxSymbolId,
                rxSymbol: this.$$rxSymbol,
                rxSampleDspDetails: this.$$rxSampleDspDetailsId
            };
        };

        PhysicalLayer.prototype.getRxSyncStatus = function () {
            var rxSyncDspDetails = this.$$rxSyncDetector.getRxSyncDspDetails();

            return {
                id: this.$$rxSyncStatusId,
                isRxSyncInProgress: this.$$isRxSyncInProgress,
                isRxSyncOk: !!rxSyncDspDetails.id,
                rxSyncDspDetailsId: rxSyncDspDetails.id,
                rxSampleDspDetailsId: this.$$rxSampleDspDetailsId
            };
        };

        PhysicalLayer.prototype.getRxSampleDspDetails = function () {
            return {
                id: this.$$rxSampleDspDetailsId,
                rxSymbolRaw: this.$$rxSymbolRaw,
                rxSignalDecibel: this.$$rxSignalDecibel,
                // rxSignalDecibelNextCandidate: this.$$rxSignalDecibelNextCandidate,  // TODO add this at some point
                rxNoiseDecibel: this.$$rxNoiseDecibel,
                rxFrequencyData: this.$$rxFrequencyData.slice(0),
                isRxSymbolSamplingPoint: this.$$isRxSymbolSamplingPoint,
                rxSampleNumber: this.$$sampleNumber,
                rxSampleOffset: this.$$sampleOffset
            };
        };

        PhysicalLayer.prototype.getRxSyncDspDetails = function () {
            var rxSyncDspDetails = this.$$rxSyncDetector.getRxSyncDspDetails();

            return {
                id: rxSyncDspDetails.id,
                rxSymbolSamplingPointOffset: rxSyncDspDetails.rxSymbolSamplingPointOffset,
                rxCorrelationValue: rxSyncDspDetails.rxCorrelationValue,
                rxCorrelationCodeLength: rxSyncDspDetails.rxCorrelationCodeLength,
                rxSignalDecibelAverage: rxSyncDspDetails.rxSignalDecibelAverage,
                rxNoiseDecibelAverage: rxSyncDspDetails.rxNoiseDecibelAverage,
                rxSignalToNoiseRatio: rxSyncDspDetails.rxSignalToNoiseRatio
            };
        };

        PhysicalLayer.prototype.getRxDspConfig = function () {
            var rxSymbolFrequencySpacing = this.$$getFrequency(
                PhysicalLayer.$$_FIRST_SYMBOL,
                this.$$rxSampleRate
            );

            return {
                rxSampleRate: this.$$rxSampleRate,
                rxSymbolFrequencySpacing: rxSymbolFrequencySpacing,
                rxSymbolMin: this.$$rxSymbolMin,
                rxSymbolMax: this.$$rxSymbolMax,
                rxSignalDecibelThreshold: this.$$rxSignalDecibelThreshold,
                rxSignalDecibelThresholdFactor: this.$$rxSignalDecibelThresholdFactor
            };
        };

        PhysicalLayer.prototype.getDspConfig = function () {
            return {
                fftSkipFactor: this.$$fftSkipFactor,
                fftSize: this.$$fftSize,
                samplePerSymbol: this.$$samplePerSymbol,
                unitTime: this.$$unitTime,
                isLoopbackEnabled: this.$$audioMonoIO.isLoopbackEnabled()
            };
        };

        PhysicalLayer.prototype.getTxSymbol = function () {
            return this.$$txSymbolManager.getTxSymbol();
        };

        PhysicalLayer.prototype.getTxSymbolProgress = function () {
            return this.$$txSymbolManager.getTxSymbolProgress();
        };

        PhysicalLayer.prototype.getTxDspConfig = function () {
            var txSymbolFrequencySpacing = this.$$getFrequency(
                PhysicalLayer.$$_FIRST_SYMBOL,
                this.$$txSampleRate
            );

            return {
                txSampleRate: this.$$txSampleRate,
                txSymbolFrequencySpacing: txSymbolFrequencySpacing,
                txSymbolMin: this.$$txSymbolMin,
                txSymbolMax: this.$$txSymbolMax,
                txAmplitude: this.$$txAmplitude
            }
        };

        // -----------------------------------------

        PhysicalLayer.prototype.$$smartTimerListener = function () {
            if (this.$$firstSmartTimerCall) {
                this.$$rxDspConfigListener ? this.$$rxDspConfigListener(this.getRxDspConfig()) : undefined;
                this.$$dspConfigListener ? this.$$dspConfigListener(this.getDspConfig()) : undefined;
                this.$$txDspConfigListener ? this.$$txDspConfigListener(this.getTxDspConfig()) : undefined;
            }

            this.$$sampleOffset = this.$$sampleNumber % this.$$samplePerSymbol;
            this.$$rx();
            this.$$tx();

            this.$$sampleNumber++;

            this.$$firstSmartTimerCall = false;
        };

        PhysicalLayer.prototype.$$rx = function () {
            var
                isAllowedToListen,
                fftResult,
                rxSyncDspDetails,
                isNewSyncAvailable = false,
                isNewSymbolReadyToTake,
                fakeFrequencyData,
                i;

            this.$$rxSampleDspDetailsId++;
            this.$$rxSyncStatusId++;

            isAllowedToListen =
                this.$$txSymbolManager.getTxSymbolCurrent().isIdle() ||
                this.$$audioMonoIO.isLoopbackEnabled();

            if (isAllowedToListen) {
                fftResult = new FFTResult(this.$$audioMonoIO.getFrequencyData(), this.$$rxSampleRate);
                fftResult.downconvert(this.$$fftSkipFactor);
                this.$$rxFrequencyData = fftResult.getFrequencyData();
                this.$$rxSymbolRaw = fftResult.getLoudestBinIndexInBinRange(this.$$rxSymbolMin, this.$$rxSymbolMax);
                this.$$rxSignalDecibel = fftResult.getDecibel(this.$$rxSymbolRaw);
                this.$$rxSignalDecibelNextCandidate = -Infinity; // TODO add this at some point
                this.$$rxNoiseDecibel = fftResult.getDecibelAverage(this.$$rxSymbolMin, this.$$rxSymbolMax, this.$$rxSymbolRaw);
            } else {
                // TODO experiments - refactor this
                fakeFrequencyData = [];
                for (i = 0; i < this.$$fftSize * 0.5; i++) {
                    fakeFrequencyData.push(-160);
                }
                fftResult = new FFTResult(fakeFrequencyData, this.$$rxSampleRate);
                fftResult.downconvert(this.$$fftSkipFactor);
                this.$$rxFrequencyData = fftResult.getFrequencyData();
                this.$$rxSymbolRaw = this.$$rxSymbolMin;
                this.$$rxSignalDecibel = -Infinity;
                this.$$rxSignalDecibelNextCandidate = -Infinity;
                this.$$rxNoiseDecibel = -Infinity;
            }

            this.$$handleRxSync();

            this.$$isRxSyncInProgress = this.$$rxSyncDetector.isRxSyncInProgress();
            rxSyncDspDetails = this.$$rxSyncDetector.getRxSyncDspDetails();
            if (rxSyncDspDetails.id && rxSyncDspDetails.id !== this.$$rxSyncDspDetailsLastId) {
                this.$$rxSignalDecibelThreshold = rxSyncDspDetails.rxNoiseDecibelAverage +
                    this.$$rxSignalDecibelThresholdFactor * rxSyncDspDetails.rxSignalToNoiseRatio;
                this.$$rxSyncDspDetailsLastId = rxSyncDspDetails.id;
                isNewSyncAvailable = true;
            }

            this.$$isRxSymbolSamplingPoint = rxSyncDspDetails.id > 0 && this.$$sampleOffset === rxSyncDspDetails.rxSymbolSamplingPointOffset;
            isNewSymbolReadyToTake = this.$$isRxSymbolSamplingPoint && this.$$rxSignalDecibel > this.$$rxSignalDecibelThreshold;
            this.$$rxSymbol = isNewSymbolReadyToTake ? this.$$rxSymbolRaw : PhysicalLayer.$$_RX_SYMBOL_IDLE;

            // call listeners
            if (isNewSyncAvailable) {
                this.$$rxSyncDspDetailsListener ? this.$$rxSyncDspDetailsListener(this.getRxSyncDspDetails()) : undefined;
                this.$$rxDspConfigListener ? this.$$rxDspConfigListener(this.getRxDspConfig()) : undefined;
            }
            this.$$rxSampleDspDetailsListener ? this.$$rxSampleDspDetailsListener(this.getRxSampleDspDetails()) : undefined;
            this.$$rxSyncStatusListener ? this.$$rxSyncStatusListener(this.getRxSyncStatus()) : undefined;
            if (this.$$isRxSymbolSamplingPoint) {
                this.$$rxSymbolId++;
                this.$$rxSymbolListener ? this.$$rxSymbolListener(this.getRxSymbol()) : undefined;
            }
        };

        PhysicalLayer.prototype.$$tx = function () {
            var
                isFirstSampleOfBlock = this.$$sampleOffset === 0,
                isTxAboutToStart,
                isTxAboutToEnd;

            if (!isFirstSampleOfBlock) {
                return;
            }

            isTxAboutToStart = this.$$txSymbolManager.isTxAboutToStart();
            isTxAboutToEnd = this.$$txSymbolManager.isTxAboutToEnd();
            this.$$txSymbolManager.tick();

            if (isTxAboutToStart) {
                this.$$audioMonoIO.microphoneDisable(); // TODO experimental feature, this solves volume control problem on mobile browsers
                // console.log('microphone disable');
            }
            if (isTxAboutToEnd) {
                this.$$audioMonoIO.microphoneEnable();  // TODO experimental feature, this solves volume control problem on mobile browsers
                // console.log('microphone enable');
            }

            this.$$updateOscillator();

            this.$$txSymbolListener ? this.$$txSymbolListener(this.getTxSymbol()) : undefined;
            this.$$txSymbolProgressListener ? this.$$txSymbolProgressListener(this.getTxSymbolProgress()) : undefined;
        };

        // -------

        PhysicalLayer.prototype.$$handleRxSync = function () {
            var correlationCodeValue = null;

            switch (this.$$rxSymbolRaw) {
                case this.$$rxSymbolMax - PhysicalLayer.$$_SYMBOL_SYNC_A_OFFSET:
                    correlationCodeValue = -1;
                    break;
                case this.$$rxSymbolMax - PhysicalLayer.$$_SYMBOL_SYNC_B_OFFSET:
                    correlationCodeValue = 1;
                    break;
            }
            this.$$rxSyncDetector.handle(
                correlationCodeValue, this.$$rxSignalDecibel, this.$$rxNoiseDecibel
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
            var frequency, amplitude, isFsk, txSymbolCurrent;

            txSymbolCurrent = this.$$txSymbolManager.getTxSymbolCurrent();
            isFsk = txSymbolCurrent.isFsk();
            if (isFsk) {
                frequency = this.$$getFrequency(txSymbolCurrent.getTxFskSymbol(), this.$$txSampleRate);
                amplitude = this.$$txAmplitude;
            } else {
                frequency = PhysicalLayer.$$_TX_FREQUENCY_ZERO;
                amplitude = PhysicalLayer.$$_TX_AMPLITUDE_SILENT;
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

        return PhysicalLayer;
    }

})();
