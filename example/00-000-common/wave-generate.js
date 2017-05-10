// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

var WaveGenerate;

WaveGenerate = function (samplePerPeriod) {
    this.$$omega = null;
    this.$$sampleNumber = null;
    this.setSamplePerPeriod(samplePerPeriod);
    this.$$phase = WaveGenerate.NO_PHASE_SHIFT;
    this.$$amplitude = WaveGenerate.UNIT_AMPLITUDE;
    this.$$sample = null;
};

WaveGenerate.UNIT_AMPLITUDE = 1;
WaveGenerate.NO_PHASE_SHIFT = 0;

WaveGenerate.prototype.$$computeSample = function () {
    var x;

    x = this.$$omega * this.$$sampleNumber;
    this.$$sample = this.$$amplitude * Math.sin(x - this.$$phase);
};

WaveGenerate.prototype.setSamplePerPeriod = function (samplePerPeriod) {
    this.$$omega = 2 * Math.PI / samplePerPeriod;
    this.$$sampleNumber = 0;
};

WaveGenerate.prototype.setUnitPhase = function (unitPhase) {
    this.$$phase = 2 * Math.PI * unitPhase;  // convert to radians
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
