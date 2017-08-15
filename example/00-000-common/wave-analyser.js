// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

/**
 * Requires:
 *     buffer.js
 *     complex.js
 */

var WaveAnalyser;

WaveAnalyser = function (samplePerPeriod, windowSize, applyWindowFunction) {
    samplePerPeriod = samplePerPeriod || WaveAnalyser.$$_DEFAULT_SAMPLE_PER_PERIOD;
    windowSize = windowSize || WaveAnalyser.$$_DEFAULT_WINDOW_SIZE;

    this.$$cyclePerSample = null;
    this.$$firstSampleOfBufferNumber = null;
    this.setSamplePerPeriod(samplePerPeriod);
    this.$$sampleBuffer = new Buffer(windowSize);
    this.$$applyWindowFunction = !!applyWindowFunction;
    this.$$frequencyBin = null;
};

WaveAnalyser.$$_UNIT_PHASE = 1;
WaveAnalyser.$$_NEGATIVE_FREQUENCIES_AMPLITUDE_FIX = 2;
WaveAnalyser.$$_PHASE_CORRECTION = 0.75;
WaveAnalyser.$$_DECIBEL_POWER_FROM_AMPLITUDE_FACTOR = 20;
WaveAnalyser.$$_DEFAULT_SAMPLE_PER_PERIOD = 32;
WaveAnalyser.$$_DEFAULT_WINDOW_SIZE = 1024;

WaveAnalyser.prototype.$$computeFrequencyBin = function () {
    var
        size,
        i,
        n,
        unitAngle,
        complex,
        sampleValue,
        windowFunctionValue;

    this.$$frequencyBin = Complex.zero();

    size = this.$$sampleBuffer.getSize();
    for (i = 0; i < size; i++) {
        n = this.$$firstSampleOfBufferNumber + i;
        unitAngle = this.$$cyclePerSample * n;
        complex = Complex.polar(-unitAngle);

        sampleValue = this.$$sampleBuffer.getItem(i);
        complex.multiplyScalar(sampleValue);

        if (this.$$applyWindowFunction) {
            windowFunctionValue = WaveAnalyser.blackman(i, size);
            complex.multiplyScalar(windowFunctionValue);
        }

        this.$$frequencyBin.add(complex);
    }
};

WaveAnalyser.prototype.setSamplePerPeriod = function (samplePerPeriod) {
    this.$$cyclePerSample = 1 / samplePerPeriod;
    this.$$firstSampleOfBufferNumber = 0;
    this.$$frequencyBin = null;
};

WaveAnalyser.prototype.setWindowSize = function (windowSize) {
    this.$$sampleBuffer.setSizeMax(windowSize);  // this call clears the buffer too
    this.$$firstSampleOfBufferNumber = 0;
    this.$$frequencyBin = null;
};

WaveAnalyser.prototype.enableWindowFunction = function () {
    this.$$applyWindowFunction = true;
    this.$$frequencyBin = null;
};

WaveAnalyser.prototype.disableWindowFunction = function () {
    this.$$applyWindowFunction = false;
    this.$$frequencyBin = null;
};

WaveAnalyser.prototype.handle = function (sample) {
    if (this.$$sampleBuffer.isFull()) {
        this.$$firstSampleOfBufferNumber++;
    }
    this.$$sampleBuffer.pushEvenIfFull(sample);
    this.$$frequencyBin = null;
};

WaveAnalyser.prototype.getAmplitude = function () {
    var magnitude, tmp, amplitude;

    if (!this.$$frequencyBin) {
        this.$$computeFrequencyBin();
    }

    magnitude = this.$$frequencyBin.getMagnitude();
    tmp = magnitude / this.$$sampleBuffer.getSize();

    // for real samples half of the energy is in negative frequency
    amplitude = tmp * WaveAnalyser.$$_NEGATIVE_FREQUENCIES_AMPLITUDE_FIX;

    // amplitude is valid only when window function is disabled and
    // you have pure sine waves in the signal with integer number of
    // cycles in the window size (no 'leakage')

    return amplitude;
};

WaveAnalyser.prototype.getUnitPhase = function () {
    var unitAngle, tmp, unitPhase;

    if (!this.$$frequencyBin) {
        this.$$computeFrequencyBin();
    }

    unitAngle = this.$$frequencyBin.getUnitAngle();
    // sine wave without any phase offset is a complex number with real part equal zero
    // and imaginary part on the negative side (vector pointing downwards -> 270 degrees)
    tmp = unitAngle - WaveAnalyser.$$_PHASE_CORRECTION;
    // correction from line above may produce negative phase so we need to fix it
    tmp = tmp < 0
        ? tmp + WaveAnalyser.$$_UNIT_PHASE
        : tmp;
    // fix direction - when sine wave is moving to the right in time domain
    // then phase angle should increase counter-clockwise
    tmp = WaveAnalyser.$$_UNIT_PHASE - tmp;

    unitPhase = tmp % WaveAnalyser.$$_UNIT_PHASE; // keep phase in <0, 1) range

    return unitPhase;
};

WaveAnalyser.prototype.getDecibel = function () {
    var decibel, amplitude;

    if (!this.$$frequencyBin) {
        this.$$computeFrequencyBin();
    }

    amplitude = this.getAmplitude();
    decibel = WaveAnalyser.$$_DECIBEL_POWER_FROM_AMPLITUDE_FACTOR *
        Math.log(amplitude) / Math.LN10;

    return decibel;
};

WaveAnalyser.prototype.getFrequencyBin = function () {
    if (!this.$$frequencyBin) {
        this.$$computeFrequencyBin();
    }

    return this.$$frequencyBin.clone();
};

WaveAnalyser.blackmanNuttall = function (n, N) {
    return 0.3635819
        - 0.4891775 * Math.cos(2 * Math.PI * n / (N - 1))
        + 0.1365995 * Math.cos(4 * Math.PI * n / (N - 1))
        - 0.0106411 * Math.cos(6 * Math.PI * n / (N - 1));
};

// https://www.w3.org/TR/webaudio/#fft-windowing-and-smoothing-over-time
WaveAnalyser.blackman = function (n, N) {
    var
        alpha = 0.16,
        a0 = 0.5 * (1 - alpha),
        a1 = 0.5,
        a2 = 0.5 * alpha;

    return a0
        - a1 * Math.cos(2 * Math.PI * n / (N - 1))
        + a2 * Math.cos(4 * Math.PI * n / (N - 1));
};
