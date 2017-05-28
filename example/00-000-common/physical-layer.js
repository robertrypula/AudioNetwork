// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayer;

PhysicalLayer = function () {
    this.$$audioMonoIO = new AudioMonoIO(PhysicalLayer.RX_FFT_SIZE);
    this.$$syncBarkerCode = new BarkerCode(PhysicalLayer.RX_SAMPLE_FACTOR);
    this.$$rxSmartTimer = new SmartTimer(PhysicalLayer.RX_TIME_MS);
    this.$$txSmartTimer = new SmartTimer(PhysicalLayer.TX_TIME_MS);
    this.$$txAmplitude = PhysicalLayer.TX_INITIAL_AMPLITUDE;

    this.$$rxMode;
    this.$$rxBitPerDataSymbol;   // bits per data symbol
    this.$$rxBinSizeData;        // data symbols (2^bitsPerData)
    this.$$rxBinSizeTotal;       // data symbols + start frame + end frame
    this.$$rxBinIndexFirst;      // index of first data symbol
    this.$$rxBinIndexFrameStart; // index of start frame
    this.$$rxBinIndexFrameEnd;   // index of end frame
    this.$$rxOffset;

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

PhysicalLayer.CHANNEL_BIT_PER_DATA_SYMBOL = 6;
PhysicalLayer.CHANNEL_A_FREQUENCY_BAND_START = 1000;
PhysicalLayer.CHANNEL_B_FREQUENCY_BAND_START = 4200;

PhysicalLayer.RX_MODE_DISABLED = 'RX_MODE_DISABLED';
PhysicalLayer.RX_MODE_CHANNEL_A_NORMAL = 'RX_MODE_CHANNEL_A_NORMAL';
PhysicalLayer.RX_MODE_CHANNEL_A_BARKER_CODE = 'RX_MODE_CHANNEL_A_BARKER_CODE';
PhysicalLayer.RX_MODE_CHANNEL_B_NORMAL = 'RX_MODE_CHANNEL_B_NORMAL';
PhysicalLayer.RX_MODE_CHANNEL_B_BARKER_CODE = 'RX_MODE_CHANNEL_B_BARKER_CODE';

PhysicalLayer.TX_MODE_DISABLED = 'TX_MODE_DISABLED';
PhysicalLayer.TX_MODE_CHANNEL_A_NORMAL = 'TX_MODE_CHANNEL_A_NORMAL';
PhysicalLayer.TX_MODE_CHANNEL_A_BARKER_CODE = 'TX_MODE_CHANNEL_A_BARKER_CODE';
PhysicalLayer.TX_MODE_CHANNEL_B_NORMAL = 'TX_MODE_CHANNEL_B_NORMAL';
PhysicalLayer.TX_MODE_CHANNEL_B_BARKER_CODE = 'TX_MODE_CHANNEL_B_BARKER_CODE';

PhysicalLayer.UNSUPPORTED_RX_MODE = 'Unsupported RX mode';

PhysicalLayer.prototype.setReceiverMode = function (rxMode) {
    var
        channelFrequencyBandStart;

    switch (rxMode) {
        case PhysicalLayer.RX_MODE_DISABLED:
            break;
        case PhysicalLayer.RX_MODE_CHANNEL_A_NORMAL:
        case PhysicalLayer.RX_MODE_CHANNEL_A_BARKER_CODE:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_A_FREQUENCY_BAND_START;
            break;
        case PhysicalLayer.RX_MODE_CHANNEL_B_NORMAL:
        case PhysicalLayer.RX_MODE_CHANNEL_B_BARKER_CODE:
            channelFrequencyBandStart = PhysicalLayer.CHANNEL_B_FREQUENCY_BAND_START;
            break;
        default:
            throw PhysicalLayer.UNSUPPORTED_RX_MODE;
    }

    this.$$rxMode = rxMode;
    if (this.$$rxMode === PhysicalLayer.RX_MODE_DISABLED) {
        return;
    }

    this.$$rxBitPerDataSymbol = PhysicalLayer.CHANNEL_BIT_PER_DATA_SYMBOL;
    this.$$rxBinSizeData = Math.pow(2, this.$$rxBitPerDataSymbol);
    this.$$rxBinSizeTotal = this.$$rxBinSizeData + 2;
    this.$$rxBinIndexFirst = FFTResult.getBinIndex(
        channelFrequencyBandStart,
        this.$$audioMonoIO.getSampleRate(),
        PhysicalLayer.TX_FFT_SIZE // TX is fine here because we are down-converting rx decibel array before indexing
    );
    this.$$rxBinIndexFrameStart = this.$$rxBinIndexFirst + this.$$rxBinSizeData;
    this.$$rxBinIndexFrameEnd = this.$$rxBinIndexFrameStart + 1;
    this.$$rxOffset = 0;

    console.log(this);
    /*
    44100 - 1024 - 43.06640625
    Channel A
    23  -  990.5 Hz
    90  - 3876.0 Hz
    Channel B
    98  - 4220.5 Hz
    165 - 7106.0 Hz

    48000 - 1024 - 46.875
    Channel A
    21  -  984.4 Hz
    88  - 4125.0 Hz
    Channel B
    90  - 4218.8 Hz
    157 - 7359.4 Hz
    */
};

PhysicalLayer.prototype.setTransmitterMode = function (txMode) {

};

PhysicalLayer.prototype.$$setTxSound = function (indexToTransmit) {
    var frequency;

    frequency = indexToTransmit * this.$$txSampleRate / PhysicalLayer.TX_FFT_SIZE;
    audioMonoIO.setPeriodicWave(frequency, this.$$txAmplitude);
};

PhysicalLayer.prototype.$$rxSmartTimerHandler = function () {
    var
        frequencyData = this.$$audioMonoIO.getFrequencyData(),
        fftResult = new FFTResult(
            frequencyData,
            this.$$audioMonoIO.getSampleRate()
        );

    fftResult.downconvert(PhysicalLayer.RX_RESOLUTION_EXPONENT);
};

PhysicalLayer.prototype.$$txSmartTimerHandler = function () {

};