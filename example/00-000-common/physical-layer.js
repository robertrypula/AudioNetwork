// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayer;

PhysicalLayer = function () {
    this.$$audioMonoIO = new AudioMonoIO(PhysicalLayer.RX_FFT_SIZE);
    this.$$barkerCode = new BarkerCode(PhysicalLayer.RX_SAMPLE_FACTOR);
    this.$$rxSmartTimer = new SmartTimer(PhysicalLayer.RX_TIME_MS);
    this.$$txSmartTimer = new SmartTimer(PhysicalLayer.TX_TIME_MS);
    this.$$txAmplitude = PhysicalLayer.TX_INITIAL_AMPLITUDE;

    this.$$rxMode = null;
    this.$$rxBinIndexData = null;
    this.$$rxDataExponent = null;
    this.$$rxDataValue = null;
    this.$$rxOffset = 0;

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

PhysicalLayer.prototype.setReceiverMode = function (rxMode) {
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