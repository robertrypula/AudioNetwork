// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

/**
 * Requires:
 *     buffer.js
 *     complex.js
 */

var WaveAnalyser;

WaveAnalyser = function (samplePerPeriod, windowSize, applyWindowFunction) {
    this.$$omega = 2 * Math.PI / samplePerPeriod;
    this.$$sampleBuffer = new Buffer(windowSize);
    this.$$applyWindowFunction = applyWindowFunction;
    this.$$sampleNumber = 0;

    this.$$frequencyBin = null;
};

WaveAnalyser.prototype.$$computeFrequencyBin = function () {
    var i, size, windowFunctionValue, sampleValue, angle, complex;

    this.$$frequencyBin = new Complex(0, 0);
    size = this.$$sampleBuffer.getSize();
    for (i = 0; i < size; i++) {
        sampleValue = this.$$sampleBuffer.getItem(i);

        angle = this.$$omega * this.$$sampleNumber;
        complex = Complex.polar(angle);

        complex.multiplyScalar(sampleValue);
        if (this.$$applyWindowFunction) {
            windowFunctionValue = WaveAnalyser.blackmanNuttall(i, size);
            complex.multiplyScalar(sampleValue);
        }
        this.$$frequencyBin.add(complex);
    }
};

WaveAnalyser.prototype.handle = function (sample) {
    if (this.$$sampleBuffer.isFull()) {
        this.$$sampleNumber++;
    }
    this.$$sampleBuffer.pushEvenIfFull(sample);
    this.$$frequencyBin = null;
};

WaveAnalyser.prototype.getAmplitude = function () {
    if (!this.$$frequencyBin) {
        this.$$computeFrequencyBin();
    }

    return this.$$frequencyBin.getRadius();
};

WaveAnalyser.prototype.getPhase = function () {
    var phase;

    if (!this.$$frequencyBin) {
        this.$$computeFrequencyBin();
    }

    phase = this.$$frequencyBin.getAngle();
    // sine wave without any phase offset is a complex number with real part equal zero
    // and imaginary part on the negative side (vector pointing downwards -> 270 degrees)
    phase = phase - 0.75;
    // correction from line above may produce negative phase so we need to fix it
    phase = phase < 0 ? phase + 1 : phase;
    // fix direction - when sine wave is moving to the right in time domain
    // then phase angle should increase counter-clockwise
    phase = 1 - phase;

    return phase;
};

WaveAnalyser.prototype.getDecibel = function () {
    var dB, amplitude;

    if (!this.$$frequencyBin) {
        this.$$computeFrequencyBin();
    }

    amplitude = this.getAmplitude();
    dB = 20 * Math.log(amplitude) / Math.LN10;

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
