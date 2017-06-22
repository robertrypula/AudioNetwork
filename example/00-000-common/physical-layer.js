// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayer;

PhysicalLayer = function () {
    this.$$audioMonoIO = new AudioMonoIO(PhysicalLayer.RX_FFT_SIZE);
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
    this.$$rxBarkerCodeSymbolLookup = [];
    this.$$rxBarkerCodeSync;
    this.$$rxBarkerCodeSyncLookup;
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
PhysicalLayer.RX_FFT_SIZE = 4096;
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

PhysicalLayer.UNSUPPORTED_MODE_EXCEPTION = 'Unsupported mode';

PhysicalLayer.prototype.setLoopback = function (loopback) {
    this.$$audioMonoIO.setLoopback(loopback);
};

PhysicalLayer.prototype.getReceiveSampleRate = function () {
    return this.$$audioMonoIO.getSampleRate();
};

PhysicalLayer.prototype.setReceiveHandler = function (handler) {
    this.$$rxHandler = (typeof handler === 'function')
        ? handler
        : null;
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
    var rxSymbolTime;

    if (this.$$rxMode === PhysicalLayer.MODE_DISABLED) {
        return null;
    }

    switch (this.$$rxMode) {
        case PhysicalLayer.MODE_CHANNEL_A_NORMAL:
        case PhysicalLayer.MODE_CHANNEL_B_NORMAL:
            rxSymbolTime = PhysicalLayer.TX_TIME_MS;
            break;
        case PhysicalLayer.MODE_CHANNEL_A_BARKER_CODE:
        case PhysicalLayer.MODE_CHANNEL_B_BARKER_CODE:
            rxSymbolTime = PhysicalLayer.TX_TIME_MS * BarkerCode.getCodeLength();
            break;
    }

    return {
        bitPerSymbol: this.$$rxBitPerDataSymbol,
        symbolPerSecond: 1 / rxSymbolTime,
        bitPerSecond: this.$$rxBitPerDataSymbol / rxSymbolTime,
        bytePerSecond: (this.$$rxBitPerDataSymbol / rxSymbolTime) / 8
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
    var channelFrequencyBandStart, rxRawSampleOffsetMax, symbol;

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

    // TODO create array only when mode is barker?
    this.$$rxBarkerCode.length = 0;
    this.$$rxBarkerCodeSymbolLookup.length = 0;
    for (symbol = 0; symbol < this.$$rxBinSizeTotal; symbol++) {
        this.$$rxBarkerCode.push(new BarkerCode());
        this.$$rxBarkerCodeSymbolLookup.push(
            this.$$getBarkerCodeSymbolLookup(symbol, this.$$rxBinSizeTotal)
        );
    }
    this.$$rxBarkerCodeSync = new BarkerCode(PhysicalLayer.RX_SAMPLE_FACTOR);
    this.$$rxBarkerCodeSyncLookup = this.$$getBarkerCodeSymbolLookup(this.$$rxBinSizeData + 1, this.$$rxBinSizeTotal);    // TODO frameEnd is also sync, make it explicit in the code
};

PhysicalLayer.prototype.$$getSymbolSamplingPosition = function () {
    var
        offset = this.$$rxRawSampleNumber % this.$$rxRawSampleOffsetMax,
        diff;

    diff = (2 * this.$$rxRawSampleOffsetMax + offset)
        - (1 * this.$$rxRawSampleOffsetMax + this.$$rxRawSampleOffset);

    return diff % this.$$rxRawSampleOffsetMax;
};

PhysicalLayer.prototype.$$isSymbolSamplingPoint = function () {
    var position = this.$$getSymbolSamplingPosition();

    return position === 0;
};

PhysicalLayer.prototype.$$getBarkerCodeSamplingPosition = function () {
    var
        position = this.$$getSymbolSamplingPosition(),
        barkerPosition = Math.floor(position / PhysicalLayer.RX_SAMPLE_FACTOR);

    return barkerPosition;   // valid only when $$isBarkerCodeSamplingPoint is true
};

PhysicalLayer.prototype.$$isBarkerCodeSamplingPoint = function () {
    var
        position = this.$$getSymbolSamplingPosition(),
        offset = position % PhysicalLayer.RX_SAMPLE_FACTOR;
    
    return offset === 0;
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

PhysicalLayer.prototype.$$rxNormal = function (fftResult) {
    var
        loudestBinIndex,
        receivedSymbol;

    if (!this.$$isSymbolSamplingPoint()) {
        return;
    }

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

PhysicalLayer.prototype.$$rxBarkerSymbolDecision = function () {
    var symbol, decisionList = [];

    if (this.$$rxRawSampleNumber === 0) {
        return;
    }

    for (symbol = 0; symbol < this.$$rxBinSizeTotal; symbol++) {
        decisionList.push({
            symbol: symbol,
            correlationValue: this.$$rxBarkerCode[symbol].getCorrelationValue(),
            decibelAverage: this.$$rxBarkerCode[symbol].getDecibelAverage()
        });
    }

    decisionList.sort(function (a, b) {
        return 0 ||
            a.correlationValue < b.correlationValue ? 1 : a.correlationValue > b.correlationValue ? -1 : 0 ||
            a.decibelAverage < b.decibelAverage ? 1 : a.decibelAverage > b.decibelAverage ? -1 : 0;
    });
    // console.log(decisionList);

    this.$$rxHandler({
        symbol: decisionList[0].symbol,
        symbolDecibel: decisionList[0].decibelAverage,
        rawSampleNumber: this.$$rxRawSampleNumber
    });

    // TODO remove me:
    var l = document.getElementById('rx-decision-log'), html;
    if (l) {
        html = '';
        for (var i = 0; i < 5; i++) {
            html += 'symbol ' + decisionList[i].symbol + ',  correlationValue ' + decisionList[i].correlationValue + ' @ ' + decisionList[i].decibelAverage.toFixed(2) + 'dB<br/>';
        }
        l.innerHTML = html;
    }
};

PhysicalLayer.prototype.$$rxBarker = function (fftResult) {
    var symbol, barkerCodePosition, lookup, decibelZero, decibelOne, decibel, isOne;

    if (this.$$isSymbolSamplingPoint()) {
        this.$$rxBarkerSymbolDecision();
    }

    if (!this.$$isBarkerCodeSamplingPoint()) {
        return;
    }

    barkerCodePosition = this.$$getBarkerCodeSamplingPosition();
    for (symbol = 0; symbol < this.$$rxBarkerCodeSymbolLookup.length; symbol++) {
        lookup = this.$$rxBarkerCodeSymbolLookup[symbol][barkerCodePosition];

        decibelZero = fftResult.getDecibel(this.$$rxBinIndexFirst + lookup.symbolZero);
        decibelOne = fftResult.getDecibel(this.$$rxBinIndexFirst + lookup.symbolOne);

        if (decibelOne > decibelZero) {
            isOne = true;
            decibel = decibelOne;
        } else {
            isOne = false;
            decibel = decibelZero;
        }

        this.$$rxBarkerCode[symbol].handle(isOne, decibel);
    }
};

PhysicalLayer.prototype.$$rxSync = function (fftResult) {
    var rank, offset, correlationValue, lookup, decibelZero, decibelOne, isOne, decibel;

    // TODO verify logic
    rank = this.$$rxBarkerCodeSync.getCorrelationRank();
    if (rank === BarkerCode.CORRELATION_RANK_POSITIVE_HIGH || rank === BarkerCode.CORRELATION_RANK_POSITIVE_LOW) {
        offset = this.$$rxRawSampleNumber % this.$$rxRawSampleOffsetMax;

        correlationValue = this.$$rxBarkerCodeSync.getCorrelationValue();
        decibel = this.$$rxBarkerCodeSync.getDecibelAverage();

        // TODO remove me:
        var l = document.getElementById('rx-offset-log');
        if (l) {
            l.innerHTML = 'Offset: ' + offset + ', correlationValue ' + correlationValue + ' @ ' + decibel.toFixed(2) + 'dB';
        }
    }

    lookup = this.$$rxBarkerCodeSyncLookup[0];
    // console.log(lookup);
    // TODO merge similar code that is at $$rxBarker method
    // console.log(this.$$rxBinIndexFirst + lookup.symbolZero, this.$$rxBinIndexFirst + lookup.symbolOne);

    decibelZero = fftResult.getDecibel(this.$$rxBinIndexFirst + lookup.symbolZero);
    decibelOne = fftResult.getDecibel(this.$$rxBinIndexFirst + lookup.symbolOne);



    if (decibelOne > decibelZero) {
        isOne = true;
        decibel = decibelOne;
    } else {
        isOne = false;
        decibel = decibelZero;
    }

    // console.log(decibelOne, decibelZero, isOne, decibel);

    this.$$rxBarkerCodeSync.handle(isOne, decibel);
};

PhysicalLayer.prototype.$$rxSmartTimerHandler = function () {
    var fftResult;

    if (this.$$rxMode === PhysicalLayer.MODE_DISABLED) {
        return;
    }

    fftResult = this.$$getFftResult();
    this.$$rxSync(fftResult);

    switch (this.$$rxMode) {
        case PhysicalLayer.MODE_CHANNEL_A_NORMAL:
        case PhysicalLayer.MODE_CHANNEL_B_NORMAL:
            this.$$rxNormal(fftResult);
            break;
        case PhysicalLayer.MODE_CHANNEL_A_BARKER_CODE:
        case PhysicalLayer.MODE_CHANNEL_B_BARKER_CODE:
            this.$$rxBarker(fftResult);
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

PhysicalLayer.prototype.$$getTxNullSymbolSize = function () {
    var
        sampleNumber = this.$$txRawSampleNumber,
        offsetMax = this.$$txRawSampleOffsetMax;

    return (offsetMax - (sampleNumber % offsetMax)) % offsetMax;
};

PhysicalLayer.prototype.$$getBarkerCodeSymbolLookup = function (symbol, binSizeTotal) {
    var i, symbolOffset, code, result = [];

    for (i = 0; i < BarkerCode.getCodeLength(); i++) {
        code = BarkerCode.getCodeValue(i, BarkerCode.MINUS_ONE_AS_ZERO);
        symbolOffset = code ? 1 : 0;
        result.push({
            // symbol: symbol,                              <-- uncomment when chirp field will be there
            symbolZero: (symbol) % binSizeTotal,
            symbolOne: (symbol + 1) % binSizeTotal,
            position: i,                                    // TODO add chirp field
            isOne: code ? true : false,                     // TODO add chirp field
            symbol: (symbol + symbolOffset) % binSizeTotal  // TODO add chirp field
        });
    }

    return result;
};

PhysicalLayer.prototype.transmit = function (symbol) {
    var nullSymbolSize, i, barkerCodeSymbolLookup;

    if (this.$$txMode === PhysicalLayer.MODE_DISABLED) {
        return;
    }

    if (this.$$txQueue.getSize() === 0) {
        nullSymbolSize = this.$$getTxNullSymbolSize();
        for (i = 0; i < nullSymbolSize; i++) {
            this.$$txQueue.push(-1);
        }
    }

    symbol = symbol % this.$$txBinSizeTotal;

    switch (this.$$txMode) {
        case PhysicalLayer.MODE_CHANNEL_A_NORMAL:
        case PhysicalLayer.MODE_CHANNEL_B_NORMAL:
            this.$$txQueue.push(symbol);
            break;
        case PhysicalLayer.MODE_CHANNEL_A_BARKER_CODE:
        case PhysicalLayer.MODE_CHANNEL_B_BARKER_CODE:
            barkerCodeSymbolLookup = this.$$getBarkerCodeSymbolLookup(symbol, this.$$txBinSizeTotal);
            for (i = 0; i < barkerCodeSymbolLookup.length; i++) {
                this.$$txQueue.push(
                    barkerCodeSymbolLookup[i].symbol
                );
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
    // console.log('tx symbol', symbol, '@', this.$$txRawSampleNumber);
    if (symbol !== null && symbol !== -1) {
        frequencyBinIndex = this.$$txBinIndexFirst + symbol;
        this.$$setTxSound(frequencyBinIndex);
    } else {

        this.$$setTxSound(0);
    }

    this.$$txRawSampleNumber++;
};
