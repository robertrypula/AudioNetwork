// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Util.FrequencyCalculator', FrequencyCalculator);

    FrequencyCalculator.$inject = [];

    function FrequencyCalculator() {
        var FrequencyCalculator;

        FrequencyCalculator = function (sampleRateProvider, windowSizeProvider) {
            this.$$sampleRateProvider = sampleRateProvider ? sampleRateProvider : null;
            this.$$windowSizeProvider = windowSizeProvider ? windowSizeProvider : null;

            if (!this.$$sampleRateProvider || !this.$$windowSizeProvider) {
                throw FrequencyCalculator.PLEASE_SET_BOTH_PROVIDERS;
            }
        };

        FrequencyCalculator.PLEASE_SET_BOTH_PROVIDERS = 'Please set both providers';

        FrequencyCalculator.$$isFunction = function (variable) {
            return typeof variable === 'function';
        };

        FrequencyCalculator.prototype.getSamplePerPeriodFromHertz = function (hertz) {
            var sampleRate;

            sampleRate = FrequencyCalculator.$$isFunction(this.$$sampleRateProvider)
                ? this.$$sampleRateProvider()
                : this.$$sampleRateProvider;

            return sampleRate / hertz;
        };

        FrequencyCalculator.prototype.getHertzFromSamplePerPeriod = function (samplePerPeriod) {
            var sampleRate;

            sampleRate = FrequencyCalculator.$$isFunction(this.$$sampleRateProvider)
                ? this.$$sampleRateProvider()
                : this.$$sampleRateProvider;

            return sampleRate / samplePerPeriod;
        };

        FrequencyCalculator.prototype.getCyclePerWindowFromHertz = function (hertz) {
            var windowSize, sampleRate;

            windowSize = FrequencyCalculator.$$isFunction(this.$$windowSizeProvider)
                ? this.$$windowSizeProvider()
                : this.$$windowSizeProvider;
            sampleRate = FrequencyCalculator.$$isFunction(this.$$sampleRateProvider)
                ? this.$$sampleRateProvider()
                : this.$$sampleRateProvider;

            return hertz * windowSize / sampleRate;
        };

        FrequencyCalculator.prototype.getHertzFromCyclePerWindow = function (cyclePerWindow) {
            var windowSize, sampleRate;

            windowSize = FrequencyCalculator.$$isFunction(this.$$windowSizeProvider)
                ? this.$$windowSizeProvider()
                : this.$$windowSizeProvider;
            sampleRate = FrequencyCalculator.$$isFunction(this.$$sampleRateProvider)
                ? this.$$sampleRateProvider()
                : this.$$sampleRateProvider;

            return cyclePerWindow * sampleRate / windowSize;
        };

        FrequencyCalculator.prototype.getSamplePerPeriodFromCyclePerWindow = function (cyclePerWindow) {
            var windowSize;

            windowSize = FrequencyCalculator.$$isFunction(this.$$windowSizeProvider)
                ? this.$$windowSizeProvider()
                : this.$$windowSizeProvider;

            return windowSize / cyclePerWindow;
        };

        FrequencyCalculator.prototype.getCyclePerWindowFromSamplePerPeriod = function (samplePerPeriod) {
            var windowSize;

            windowSize = FrequencyCalculator.$$isFunction(this.$$windowSizeProvider)
                ? this.$$windowSizeProvider()
                : this.$$windowSizeProvider;

            return windowSize / samplePerPeriod;
        };

        return FrequencyCalculator;
    }

})();
