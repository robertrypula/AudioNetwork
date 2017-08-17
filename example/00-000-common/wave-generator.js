// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

var WaveGenerator;

WaveGenerator = function (samplePerPeriod) {
    samplePerPeriod = samplePerPeriod || WaveGenerator.$$_DEFAULT_SAMPLE_PER_PERIOD;

    this.$$omega = null;
    this.$$sampleNumber = null;
    this.setSamplePerPeriod(samplePerPeriod);
    this.$$phase = WaveGenerator.NO_PHASE_SHIFT;
    this.$$amplitude = WaveGenerator.UNIT_AMPLITUDE;
    this.$$sample = null;
};

WaveGenerator.UNIT_AMPLITUDE = 1;
WaveGenerator.NO_PHASE_SHIFT = 0;
WaveGenerator.$$_DEFAULT_SAMPLE_PER_PERIOD = 32;

WaveGenerator.prototype.$$computeSample = function () {
    var x;

    x = this.$$omega * this.$$sampleNumber;
    this.$$sample = this.$$amplitude * Math.sin(x - this.$$phase);
};

WaveGenerator.prototype.setSamplePerPeriod = function (samplePerPeriod) {
    this.$$omega = 2 * Math.PI / samplePerPeriod;
    this.$$sampleNumber = 0;
};

WaveGenerator.prototype.setUnitPhase = function (unitPhase) {
    this.$$phase = 2 * Math.PI * unitPhase;  // convert to radians
};

WaveGenerator.prototype.setAmplitude = function (amplitude) {
    this.$$amplitude = amplitude;
};

WaveGenerator.prototype.nextSample = function () {
    this.$$sampleNumber++;
    this.$$sample = null;       // clear cache
};

WaveGenerator.prototype.getSample = function () {
    if (this.$$sample === null) {
        this.$$computeSample();
    }

    return this.$$sample;
};
