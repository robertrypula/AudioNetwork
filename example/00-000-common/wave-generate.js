// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

var WaveGenerate;

WaveGenerate = function (samplePerPeriod) {
    this.$$sampleNumber = undefined;
    this.$$samplePerPeriod = 0;
    this.$$phase = 0;
    this.$$amplitude = 1;
    this.$$omega = 0;
    this.$$sampleNumber = 0;
    this.$$phase = 0;
    this.setSamplePerPeriod(samplePerPeriod);
};

WaveGenerate.prototype.$$getSample = function () {
    var
        phase,
        x,
        sample;

    phase = this.$$phase * 2 * Math.PI;
    x = this.$$omega * this.$$sampleNumber;
    sample = this.$$amplitude * Math.sin(x - phase);

    return sample;
};

WaveGenerate.prototype.setPhase = function (phase) {
    this.$$phase = phase;
    this.$$sampleNumber = undefined;       // clear cache
};

WaveGenerate.prototype.setAmplitude = function (amplitude) {
    this.$$amplitude = amplitude;
    this.$$sampleNumber = undefined;       // clear cache
};

WaveGenerate.prototype.nextSample = function () {
    this.$$sampleNumber++;
    this.$$sampleNumber = undefined;       // clear cache
};

WaveGenerate.prototype.getSample = function () {
    if (typeof this.$$sampleNumber !== 'undefined') {
        return this.$$sampleNumber;
    }
    
    this.$$sampleNumber = this.$$getSample();      // cache sample

    return this.$$sampleNumber;
};

WaveGenerate.prototype.setSamplePerPeriod = function (samplePerPeriod, connected) {
    if (samplePerPeriod === this.$$samplePerPeriod) {
        return false;
    }

    // TODO add logic that will make new cos continuous

    this.$$samplePerPeriod = samplePerPeriod;
    this.$$omega = 2 * Math.PI / this.$$samplePerPeriod;  // revolutions per sample
    this.$$sampleNumber = 0;
    this.$$sampleNumber = undefined;       // clear cache

    return true;
};
