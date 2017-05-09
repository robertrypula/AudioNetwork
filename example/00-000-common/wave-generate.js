// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

var WaveGenerate;

WaveGenerate = function (samplePerPeriod) {
    this.$$omega = undefined;
    this.$$sampleNumber = undefined;
    this.setSamplePerPeriod(samplePerPeriod);
    this.$$phase = 0;
    this.$$amplitude = 1;
    this.$$sample = null;
};

WaveGenerate.prototype.$$computeSample = function () {
    var phase, x;

    phase = 2 * Math.PI * this.$$phase;
    x = this.$$omega * this.$$sampleNumber;
    this.$$sample = this.$$amplitude * Math.sin(x - phase);
};

WaveGenerate.prototype.setSamplePerPeriod = function (samplePerPeriod) {
    this.$$omega = 2 * Math.PI / samplePerPeriod;
    this.$$sampleNumber = 0;
};

WaveGenerate.prototype.setPhase = function (phase) {
    this.$$phase = phase;
};

WaveGenerate.prototype.setAmplitude = function (amplitude) {
    this.$$amplitude = amplitude;
};

WaveGenerate.prototype.nextSample = function () {
    this.$$sampleNumber++;
    this.$$sample = null;       // clear cache
};

WaveGenerate.prototype.getSample = function () {
    if (this.$$sample === null) {
        this.$$computeSample();
    }

    return this.$$sample;
};
