// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayer;

PhysicalLayer = function () {
    this.$$audioMonoIO = new AudioMonoIO(PhysicalLayer.RX_FFT_SIZE);
    this.$$syncBarkerCode = new BarkerCode(PhysicalLayer.RX_SAMPLE_FACTOR);
    this.$$rxSmartTimer = new SmartTimer(PhysicalLayer.RX_TIME_MS);
    this.$$txSmartTimer = new SmartTimer(PhysicalLayer.TX_TIME_MS);
    this.$$rxHandler = null;
    this.$$txAmplitude = PhysicalLayer.TX_INITIAL_AMPLITUDE;

    this.$$rxMode;
    this.$$rxRawSampleOffset;
    this.$$rxRawSampleOffsetMax;
    this.$$rxRawSampleNumber;
    this.$$rxBitPerDataSymbol;   // bits per data symbol
    this.$$rxBinSizeData;        // data symbols (2^bitsPerData)
    this.$$rxBinSizeTotal;       // data symbols + start frame + end frame
    this.$$rxBinIndexFirst;      // index of first data symbol
    this.$$rxBinIndexFrameStart; // index of start frame
    this.$$rxBinIndexFrameEnd;   // index of end frame
    this.$$rxFrequencyBandStart;
    this.$$rxFrequencyBandEnd;
    this.$$rxBarkerCode = [];
    this.$$rxBarkerCodePower = [];
    this.setReceiverMode(PhysicalLayer.MODE_DISABLED);

    this.$$txMode;
    this.$$txRawSampleOffsetMax;
    this.$$txRawSampleNumber;
    this.$$txBitPerDataSymbol;
    this.$$txBinSizeData;
    this.$$txBinSizeTotal;
    this.$$txSampleRate;
    this.$$txBinIndexFirst;
    this.$$txBinIndexFrameStart;
    this.$$txBinIndexFrameEnd;
    this.$$txQueue = new Buffer(PhysicalLayer.TX_QUEUE_BUFFER_SIZE);
    this.setTransmitterMode(PhysicalLayer.MODE_DISABLED, 0);

    this.$$rxSmartTimer.setHandler(this.$$rxSmartTimerHandler.bind(this));
    this.$$txSmartTimer.setHandler(this.$$txSmartTimerHandler.bind(this));
};

PhysicalLayer.RX_RESOLUTION_EXPONENT = 2;
PhysicalLayer.RX_SAMPLE_FACTOR = 2;
PhysicalLayer.RX_FFT_SIZE = 4 * 1024;
PhysicalLayer.TX_FFT_SIZE = PhysicalLayer.RX_FFT_SIZE / Math.pow(2, PhysicalLayer.RX_RESOLUTION_EXPONENT);
PhysicalLayer.RX_TIME_MS = 0.1;
PhysicalLayer.TX_TIME_MS = PhysicalLayer.RX_TIME_MS * PhysicalLayer.RX_SAMPLE_FACTOR;
PhysicalLayer.TX_INITIAL_AMPLITUDE = 0.5;
PhysicalLayer.TX_QUEUE_BUFFER_SIZE = 1024;

PhysicalLayer.SINGLE_CHANNEL_BIT_PER_DATA_SYMBOL = 6;
PhysicalLayer.CHANNEL_A_FREQUENCY_BAND_START = 1000;
PhysicalLayer.CHANNEL_B_FREQUENCY_BAND_START = 4200;

PhysicalLayer.MODE_DISABLED = 'MODE_DISABLED';
PhysicalLayer.MODE_CHANNEL_A_NORMAL = 'MODE_CHANNEL_A_NORMAL';
PhysicalLayer.MODE_CHANNEL_A_BARKER_CODE = 'MODE_CHANNEL_A_BARKER_CODE';
PhysicalLayer.MODE_CHANNEL_B_NORMAL = 'MODE_CHANNEL_B_NORMAL';
PhysicalLayer.MODE_CHANNEL_B_BARKER_CODE = 'MODE_CHANNEL_B_BARKER_CODE';

PhysicalLayer.UNSUPPORTED_MODE_EXCEPTION = 'Unsupported RX mode';

PhysicalLayer.prototype.setLoopback = function (loopback) {
    this.$$audioMonoIO.setLoopback(loopback);
};

PhysicalLayer.prototype.getReceiveSampleRate = function () {
    return this.$$audioMonoIO.getSampleRate();
};

PhysicalLayer.prototype.setReceiveHandler = function (handler) {
    if (typeof handler === 'function') {
        this.$$rxHandler = handler;
    } else {
        this.$$rxHandler = null;
    }
};

PhysicalLayer.prototype.setReceiveRawSampleOffset = function (offset) {
    this.$$rxRawSampleOffset = offset % this.$$rxRawSampleOffsetMax;
};

PhysicalLayer.prototype.getReceiveRawSampleOffset = function () {
    if (this.$$rxMode === PhysicalLayer.MODE_DISABLED) {
        return null;
    }

    return {
        rawSampleOffset: this.$$rxRawSampleOffset,
        rawSampleOffsetMax: this.$$rxRawSampleOffsetMax
    };
};

PhysicalLayer.prototype.getReceiveBand = function () {
    if (this.$$rxMode === PhysicalLayer.MODE_DISABLED) {
        return null;
    }

    return {
        frequencyStart: this.$$rxFrequencyBandStart,
        frequencyEnd:  this.$$rxFrequencyBandEnd
    };
};

PhysicalLayer.prototype.getReceiveSpeed = function () {
    if (this.$$rxMode === PhysicalLayer.MODE_DISABLED) {
        return null;
    }

    return {
        bitPerSymbol: this.$$rxBitPerDataSymbol,
        symbolPerSecond: 1 / PhysicalLayer.TX_TIME_MS,
        bitPerSecond: this.$$rxBitPerDataSymbol / PhysicalLayer.TX_TIME_MS,
        bytePerSecond: (this.$$rxBitPerDataSymbol / PhysicalLayer.TX_TIME_MS) / 8
    };
};

PhysicalLayer.prototype.getReceiveSymbol = function () {
    if (this.$$rxMode === PhysicalLayer.MODE_DISABLED) {
        return null;
    }

    return {
        dataMin: 0,
        dataMax: this.$$rxBinSizeData - 1,
        frameStart: this.$$rxBinSizeData,
        frameEnd: this.$$rxBinSizeData + 1
    };
};

PhysicalLayer.prototype.setReceiverMode = function (mode) {
    var channelFrequencyBandStart, rxRawSampleOffsetMax, i;

    switch (mode) {
        case PhysicalLayer.MODE_DISABLED:
            break;
        case PhysicalLayer.MODE_CHANNEL_A_NORMAL:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_A_FREQUENCY_BAND_START;
            rxRawSampleOffsetMax = PhysicalLayer.RX_SAMPLE_FACTOR;
            break;
        case PhysicalLayer.MODE_CHANNEL_A_BARKER_CODE:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_A_FREQUENCY_BAND_START;
            rxRawSampleOffsetMax = PhysicalLayer.RX_SAMPLE_FACTOR * BarkerCode.getCodeLength();
            break;
        case PhysicalLayer.MODE_CHANNEL_B_NORMAL:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_B_FREQUENCY_BAND_START;
            rxRawSampleOffsetMax = PhysicalLayer.RX_SAMPLE_FACTOR;
            break;
        case PhysicalLayer.MODE_CHANNEL_B_BARKER_CODE:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_B_FREQUENCY_BAND_START;
            rxRawSampleOffsetMax = PhysicalLayer.RX_SAMPLE_FACTOR * BarkerCode.getCodeLength();
            break;
        default:
            throw PhysicalLayer.UNSUPPORTED_MODE_EXCEPTION;
    }

    this.$$rxMode = mode;
    if (this.$$rxMode === PhysicalLayer.MODE_DISABLED) {
        return;
    }

    this.$$rxRawSampleOffset = 0;
    this.$$rxRawSampleOffsetMax = rxRawSampleOffsetMax;
    this.$$rxRawSampleNumber = 0;
    this.$$rxBitPerDataSymbol = PhysicalLayer.SINGLE_CHANNEL_BIT_PER_DATA_SYMBOL;
    this.$$rxBinSizeData = Math.pow(2, this.$$rxBitPerDataSymbol);
    this.$$rxBinSizeTotal = this.$$rxBinSizeData + 2;
    this.$$rxBinIndexFirst = FFTResult.getBinIndex(
        channelFrequencyBandStart,
        this.$$audioMonoIO.getSampleRate(),
        PhysicalLayer.TX_FFT_SIZE // TX is fine here because we are down-converting rx decibel array before indexing
    );
    this.$$rxBinIndexFrameStart = this.$$rxBinIndexFirst + this.$$rxBinSizeData;
    this.$$rxBinIndexFrameEnd = this.$$rxBinIndexFrameStart + 1;
    this.$$rxFrequencyBandStart = FFTResult.getFrequency(
        this.$$rxBinIndexFirst,
        this.$$audioMonoIO.getSampleRate(),
        PhysicalLayer.TX_FFT_SIZE
    );
    this.$$rxFrequencyBandEnd = FFTResult.getFrequency(
        this.$$rxBinIndexFrameEnd,
        this.$$audioMonoIO.getSampleRate(),
        PhysicalLayer.TX_FFT_SIZE
    );

    // TODO create array only when mode is barker
    this.$$rxBarkerCode.length = 0;
    this.$$rxBarkerCodePower.length = 0;
    for (i = 0; i < this.$$rxBinSizeTotal; i++) {
        this.$$rxBarkerCode.push(new BarkerCode());
        this.$$rxBarkerCodePower.push(new Buffer(BarkerCode.getCodeLength()));
    }
};

PhysicalLayer.prototype.$$isSampleToGrab = function () {
    return this.$$rxRawSampleNumber % this.$$rxRawSampleOffsetMax === this.$$rxRawSampleOffset
};

PhysicalLayer.prototype.$$getFftResult = function () {
    var
        frequencyData,
        fftResult;

    frequencyData = this.$$audioMonoIO.getFrequencyData();
    fftResult = new FFTResult(
        frequencyData,
        this.$$audioMonoIO.getSampleRate()
    );
    fftResult.downconvert(PhysicalLayer.RX_RESOLUTION_EXPONENT);

    return fftResult;
};

PhysicalLayer.prototype.$$rxNormal = function () {
    var
        fftResult,
        loudestBinIndex,
        receivedSymbol;

    if (!this.$$isSampleToGrab()) {
        return;
    }

    fftResult = this.$$getFftResult();

    loudestBinIndex = fftResult.getLoudestBinIndexInBinRange(
        this.$$rxBinIndexFirst,
        this.$$rxBinIndexFrameEnd
    );
    receivedSymbol = loudestBinIndex - this.$$rxBinIndexFirst;

    this.$$rxHandler({
        symbol: receivedSymbol,
        symbolDecibel: fftResult.getDecibel(loudestBinIndex),
        rawSampleNumber: this.$$rxRawSampleNumber
    });
};

PhysicalLayer.prototype.$$rxBarker = function () {
    var fftResult;

    if (!this.$$isSampleToGrab()) {
        return;
    }

    fftResult = this.$$getFftResult();

};

PhysicalLayer.prototype.$$rxSmartTimerHandler = function () {
    if (this.$$rxMode === PhysicalLayer.MODE_DISABLED) {
        return;
    }

    switch (this.$$rxMode) {
        case PhysicalLayer.MODE_CHANNEL_A_NORMAL:
        case PhysicalLayer.MODE_CHANNEL_B_NORMAL:
            this.$$rxNormal();
            break;
        case PhysicalLayer.MODE_CHANNEL_A_BARKER_CODE:
        case PhysicalLayer.MODE_CHANNEL_B_BARKER_CODE:
            this.$$rxBarker();
    }

    this.$$rxRawSampleNumber++;
};

PhysicalLayer.prototype.setTransmitterMode = function (mode, sampleRate) {
    var channelFrequencyBandStart, txRawSampleOffsetMax;

    switch (mode) {
        case PhysicalLayer.MODE_DISABLED:
            break;
        case PhysicalLayer.MODE_CHANNEL_A_NORMAL:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_A_FREQUENCY_BAND_START;
            txRawSampleOffsetMax = 1;
            break;
        case PhysicalLayer.MODE_CHANNEL_A_BARKER_CODE:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_A_FREQUENCY_BAND_START;
            txRawSampleOffsetMax = BarkerCode.getCodeLength();
            break;
        case PhysicalLayer.MODE_CHANNEL_B_NORMAL:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_B_FREQUENCY_BAND_START;
            txRawSampleOffsetMax = 1;
            break;
        case PhysicalLayer.MODE_CHANNEL_B_BARKER_CODE:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_B_FREQUENCY_BAND_START;
            txRawSampleOffsetMax = BarkerCode.getCodeLength();
            break;
        default:
            throw PhysicalLayer.UNSUPPORTED_MODE_EXCEPTION;
    }

    this.$$txMode = mode;
    if (this.$$txMode === PhysicalLayer.MODE_DISABLED) {
        return;
    }
    this.$$txRawSampleOffsetMax = txRawSampleOffsetMax;
    this.$$txRawSampleNumber = 0;
    this.$$txBitPerDataSymbol = PhysicalLayer.SINGLE_CHANNEL_BIT_PER_DATA_SYMBOL;
    this.$$txBinSizeData = Math.pow(2, this.$$txBitPerDataSymbol);
    this.$$txBinSizeTotal = this.$$txBinSizeData + 2;
    this.$$txSampleRate = sampleRate;
    this.$$txBinIndexFirst = FFTResult.getBinIndex(
        channelFrequencyBandStart,
        this.$$txSampleRate,
        PhysicalLayer.TX_FFT_SIZE
    );
    this.$$txBinIndexFrameStart = this.$$txBinIndexFirst + this.$$txBinSizeData;
    this.$$txBinIndexFrameEnd = this.$$txBinIndexFrameStart + 1;
    this.$$txQueue.setSizeMax(PhysicalLayer.TX_QUEUE_BUFFER_SIZE);
};

PhysicalLayer.prototype.$$setTxSound = function (frequencyBinIndex) {
    var frequency;

    frequency = frequencyBinIndex * this.$$txSampleRate / PhysicalLayer.TX_FFT_SIZE;
    this.$$audioMonoIO.setPeriodicWave(frequency, this.$$txAmplitude);
};

PhysicalLayer.prototype.$$getNullSymbolSize = function () {
    var
        sampleNumber = this.$$txRawSampleNumber,
        offsetMax = this.$$txRawSampleOffsetMax;

    return (offsetMax - (sampleNumber % offsetMax)) % offsetMax;
};

PhysicalLayer.prototype.$$getBarkerNormalizedSymbolList = function (symbol) {
    var i, codeOffset, symbolNormalized, result = [];

    for (i = 0; i < BarkerCode.getCodeLength(); i++) {
        codeOffset = BarkerCode.getCodeValue(i, BarkerCode.MINUS_ONE_AS_ZERO);
        symbolNormalized = (symbol + codeOffset) % this.$$txBinSizeTotal;
        result.push(symbolNormalized);
    }

    return result;
};

PhysicalLayer.prototype.transmit = function (symbol) {
    var nullSymbolSize, i, symbolNormalized, barkerNormalizedSymbolList;

    if (this.$$txMode === PhysicalLayer.MODE_DISABLED) {
        return;
    }

    nullSymbolSize = this.$$getNullSymbolSize();
    for (i = 0; i < nullSymbolSize; i++) {
        this.$$txQueue.push(-1);
    }
    symbolNormalized = symbol % this.$$txBinSizeTotal;

    switch (this.$$txMode) {
        case PhysicalLayer.MODE_CHANNEL_A_NORMAL:
        case PhysicalLayer.MODE_CHANNEL_B_NORMAL:
            this.$$txQueue.push(symbolNormalized);
            break;
        case PhysicalLayer.MODE_CHANNEL_A_BARKER_CODE:
        case PhysicalLayer.MODE_CHANNEL_B_BARKER_CODE:
            barkerNormalizedSymbolList = this.$$getBarkerNormalizedSymbolList(symbol);
            for (i = 0; i < barkerNormalizedSymbolList.length; i++) {
                this.$$txQueue.push(barkerNormalizedSymbolList[i]);
            }
            break;
    }
};

PhysicalLayer.prototype.$$txSmartTimerHandler = function () {
    var symbol, frequencyBinIndex;

    if (this.$$txMode === PhysicalLayer.MODE_DISABLED) {
        return;
    }

    symbol = this.$$txQueue.pop();
    if (symbol !== null && symbol !== -1) {
        console.log('tx symbol', symbol, '@', this.$$txRawSampleNumber);
        frequencyBinIndex = this.$$txBinIndexFirst + symbol;
        this.$$setTxSound(frequencyBinIndex);
    } else {
        this.$$setTxSound(0);
    }

    this.$$txRawSampleNumber++;
};
