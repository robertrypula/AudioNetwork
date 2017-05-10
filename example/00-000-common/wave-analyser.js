// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

/**
 * Requires:
 *     buffer.js
 *     complex.js
 */

var WaveAnalyser;

WaveAnalyser = function (samplePerPeriod, windowSize, applyWindowFunction) {
    this.$$omega = undefined;
    this.$$bufferFirstSampleNumber = undefined;
    this.setSamplePerPeriod(samplePerPeriod);
    this.$$sampleBuffer = new Buffer(windowSize);
    this.$$applyWindowFunction = applyWindowFunction;
    this.$$frequencyBin = undefined;
};

WaveAnalyser.$$_UNIT_PHASE = 1;
WaveAnalyser.$$_NEGATIVE_FREQUENCIES_AMPLITUDE_FIX = 2;
WaveAnalyser.$$_PHASE_CORRECTION = 0.75;

WaveAnalyser.prototype.$$computeFrequencyBin = function () {
    var i, size, windowFunctionValue, sampleValue, angle, n, complex;

    this.$$frequencyBin = new Complex(0, 0);
    size = this.$$sampleBuffer.getSize();
    for (i = 0; i < size; i++) {
        n = this.$$bufferFirstSampleNumber + i;
        angle = this.$$omega * n;
        complex = Complex.polar(angle);

        sampleValue = this.$$sampleBuffer.getItem(i);
        complex.multiplyScalar(sampleValue);

        if (this.$$applyWindowFunction) {
            windowFunctionValue = WaveAnalyser.blackmanNuttall(i, size);
            complex.multiplyScalar(windowFunctionValue);
        }

        this.$$frequencyBin.add(complex);
    }
};

WaveAnalyser.prototype.setSamplePerPeriod = function (samplePerPeriod) {
    this.$$omega = 1 / samplePerPeriod;
    this.$$bufferFirstSampleNumber = 0;
};

WaveAnalyser.prototype.handle = function (sample) {
    if (this.$$sampleBuffer.isFull()) {
        this.$$bufferFirstSampleNumber++;
    }
    this.$$sampleBuffer.pushEvenIfFull(sample);
    this.$$frequencyBin = undefined;
};

WaveAnalyser.prototype.getAmplitude = function () {
    var radius, amplitude;

    if (!this.$$frequencyBin) {
        this.$$computeFrequencyBin();
    }

    radius = this.$$frequencyBin.getRadius();
    amplitude = radius / this.$$sampleBuffer.getSize();

    // for real samples half of the energy is in negative frequency
    amplitude *= WaveAnalyser.$$_NEGATIVE_FREQUENCIES_AMPLITUDE_FIX;

    // this is valid only when window function is disabled and you have pure
    // sine wave in the signal with integer number of cycles in the window size
    return amplitude;
};

WaveAnalyser.prototype.getPhase = function () {
    var phase;

    if (!this.$$frequencyBin) {
        this.$$computeFrequencyBin();
    }

    phase = this.$$frequencyBin.getAngle();
    // sine wave without any phase offset is a complex number with real part equal zero
    // and imaginary part on the negative side (vector pointing downwards -> 270 degrees)
    phase = phase - WaveAnalyser.$$_PHASE_CORRECTION;
    // correction from line above may produce negative phase so we need to fix it
    phase = phase < 0
        ? phase + WaveAnalyser.$$_UNIT_PHASE
        : phase;
    // fix direction - when sine wave is moving to the right in time domain
    // then phase angle should increase counter-clockwise
    phase = WaveAnalyser.$$_UNIT_PHASE - phase;

    return phase;
};

WaveAnalyser.prototype.getDecibel = function () {
    var dB, magnitude;

    if (!this.$$frequencyBin) {
        this.$$computeFrequencyBin();
    }

    magnitude = this.getAmplitude();
    dB = 20 * Math.log(magnitude) / Math.LN10;

    return dB;
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
