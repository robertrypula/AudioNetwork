// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var FrequencyCalculator;

FrequencyCalculator = function (sampleRateProvider, windowSizeProvider) {
    this.$$sampleRateProvider = FrequencyCalculator.$$isFunction(sampleRateProvider)
        ? sampleRateProvider.bind(sampleRateProvider)
        : null;
    this.$$windowSizeProvider = FrequencyCalculator.$$isFunction(windowSizeProvider)
        ? windowSizeProvider.bind(windowSizeProvider)
        : null;

    if (!this.$$sampleRateProvider || !this.$$windowSizeProvider) {
        throw FrequencyCalculator.PLEASE_SET_BOTH_PROVIDERS;
    }
};

FrequencyCalculator.PLEASE_SET_BOTH_PROVIDERS = 'Please set both providers';

FrequencyCalculator.$$isFunction = function (variable) {
    return typeof variable === 'function';
};

FrequencyCalculator.prototype.getSamplePerPeriodFromHertz = function (hertz) {
    return this.$$sampleRateProvider() / hertz;
};

FrequencyCalculator.prototype.getHertzFromSamplePerPeriod = function (samplePerPeriod) {
    return this.$$sampleRateProvider() / samplePerPeriod;
};

FrequencyCalculator.prototype.getCyclePerWindowFromHertz = function (hertz) {
    return hertz * this.$$windowSizeProvider() / this.$$sampleRateProvider();
};

FrequencyCalculator.prototype.getHertzFromCyclePerWindow = function (cyclePerWindow) {
    return cyclePerWindow * this.$$sampleRateProvider() / this.$$windowSizeProvider();
};

FrequencyCalculator.prototype.getSamplePerPeriodFromCyclePerWindow = function (cyclePerWindow) {
    return this.$$windowSizeProvider() / cyclePerWindow;
};

FrequencyCalculator.prototype.getCyclePerWindowFromSamplePerPeriod = function (samplePerPeriod) {
    return this.$$windowSizeProvider() / samplePerPeriod;
};
