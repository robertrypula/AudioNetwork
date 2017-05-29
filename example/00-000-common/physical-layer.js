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
    this.setReceiverMode(PhysicalLayer.MODE_DISABLED);

    this.$$txMode = null;
    this.$$txSampleRate = null;
    this.$$txQueue = [];

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

PhysicalLayer.SINGLE_CHANNEL_BIT_PER_DATA_SYMBOL = 6;
PhysicalLayer.CHANNEL_A_FREQUENCY_BAND_START = 1000;
PhysicalLayer.CHANNEL_B_FREQUENCY_BAND_START = 4200;

PhysicalLayer.MODE_DISABLED = 'MODE_DISABLED';
PhysicalLayer.MODE_CHANNEL_A_NORMAL = 'MODE_CHANNEL_A_NORMAL';
PhysicalLayer.MODE_CHANNEL_A_BARKER_CODE = 'MODE_CHANNEL_A_BARKER_CODE';
PhysicalLayer.MODE_CHANNEL_B_NORMAL = 'MODE_CHANNEL_B_NORMAL';
PhysicalLayer.MODE_CHANNEL_B_BARKER_CODE = 'MODE_CHANNEL_B_BARKER_CODE';

PhysicalLayer.UNSUPPORTED_MODE_EXCEPTION = 'Unsupported RX mode';

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
    var channelFrequencyBandStart, rxRawSampleOffsetMax;

    switch (mode) {
        case PhysicalLayer.MODE_DISABLED:
            break;
        case PhysicalLayer.MODE_CHANNEL_A_NORMAL:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_A_FREQUENCY_BAND_START;
            rxRawSampleOffsetMax = PhysicalLayer.RX_SAMPLE_FACTOR;
            break;
        case PhysicalLayer.MODE_CHANNEL_A_BARKER_CODE:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_A_FREQUENCY_BAND_START;
            rxRawSampleOffsetMax = PhysicalLayer.RX_SAMPLE_FACTOR * BarkerCode.CODE_11.length;
            break;
        case PhysicalLayer.MODE_CHANNEL_B_NORMAL:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_B_FREQUENCY_BAND_START;
            rxRawSampleOffsetMax = PhysicalLayer.RX_SAMPLE_FACTOR;
            break;
        case PhysicalLayer.MODE_CHANNEL_B_BARKER_CODE:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_B_FREQUENCY_BAND_START;
            rxRawSampleOffsetMax = PhysicalLayer.RX_SAMPLE_FACTOR * BarkerCode.CODE_11.length;
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
    var
        frequencyData,
        fftResult,
        loudestBinIndex,
        receivedSymbol;

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

PhysicalLayer.prototype.setTransmitterMode = function (txMode) {

};

PhysicalLayer.prototype.$$setTxSound = function (indexToTransmit) {
    var frequency;

    frequency = indexToTransmit * this.$$txSampleRate / PhysicalLayer.TX_FFT_SIZE;
    audioMonoIO.setPeriodicWave(frequency, this.$$txAmplitude);
};

PhysicalLayer.prototype.$$txSmartTimerHandler = function () {

};