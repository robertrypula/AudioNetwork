// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.ChannelTransmit', _ChannelTransmit);

    _ChannelTransmit.$inject = [
        'Common.MathUtil',
        'Audio.ActiveAudioContext',
        'Common.CarrierGenerateBuilder'
    ];

    function _ChannelTransmit(
        MathUtil,
        ActiveAudioContext,                     // TODO remove that depencency - it's here only for sample rate
        CarrierGenerateBuilder
    ) {
        var ChannelTransmit;

        ChannelTransmit = function (index, configuration) {
            this.$$carrierGenerate = [];
            this.$$carrierFrequency = [];
            this.$$carrierPhaseCorrection = [];
            this.$$index = index;

            this.configure(configuration);
        };

        ChannelTransmit.DATA_LENGTH_DOES_NOT_MATCH_OFDM_SIZE_EXCEPTION = 'Data array length does not match configured OFDM size';
        ChannelTransmit.OFDM_INDEX_OUT_OF_RANGE_EXCEPTION = 'OFDM index out of range: ';

        ChannelTransmit.prototype.addToQueue = function (data) {
            var i;

            if (data.length !== this.$$carrierGenerate.length) {
                throw ChannelTransmit.DATA_LENGTH_DOES_NOT_MATCH_OFDM_SIZE_EXCEPTION;
            }

            for (i = 0; i < this.$$carrierGenerate.length; i++) {
                this.$$carrierGenerate[i].addToQueue(data[i]);
            }
        };

        ChannelTransmit.prototype.getOfdmSize = function () {
            return this.$$carrierGenerate.length;
        };

        ChannelTransmit.prototype.$$checkOfdmIndex = function (ofdmIndex) {
            if (ofdmIndex < 0 || ofdmIndex >= this.$$carrierGenerate.length) {
                throw ChannelTransmit.OFDM_INDEX_OUT_OF_RANGE_EXCEPTION + ofdmIndex;
            }
        };

        ChannelTransmit.prototype.getTxPhaseCorrection = function (ofdmIndex) {
            this.$$checkOfdmIndex(ofdmIndex);

            return this.$$carrierPhaseCorrection[ofdmIndex];
        };

        ChannelTransmit.prototype.getFrequency = function (ofdmIndex) {
            this.$$checkOfdmIndex(ofdmIndex);

            return this.$$carrierFrequency[ofdmIndex];
        };

        ChannelTransmit.prototype.setTxPhaseCorrection = function (ofdmIndex, phaseCorrection) {
            this.$$checkOfdmIndex(ofdmIndex);

            this.$$carrierPhaseCorrection[ofdmIndex] = phaseCorrection - MathUtil.floor(phaseCorrection);
            this.$$carrierGenerate[ofdmIndex].setPhaseCorrection(this.$$carrierPhaseCorrection[ofdmIndex]);
        };

        ChannelTransmit.prototype.setFrequency = function (ofdmIndex, frequency) {
            var samplePerPeriod;

            this.$$checkOfdmIndex(ofdmIndex);

            samplePerPeriod = ActiveAudioContext.getSampleRate() / frequency;
            this.$$carrierGenerate[ofdmIndex].setSamplePerPeriod(samplePerPeriod);
            this.$$carrierFrequency[ofdmIndex] = frequency;
        };

        ChannelTransmit.prototype.configure = function (configuration) {
            var i, cg, samplePerPeriod, frequency;

            for (i = 0; i < configuration.ofdmSize; i++) {
                frequency = configuration.baseFrequency + i * configuration.ofdmFrequencySpacing;
                samplePerPeriod = ActiveAudioContext.getSampleRate() / frequency;
                cg = CarrierGenerateBuilder.build(samplePerPeriod);
                this.$$carrierGenerate.push(cg);
                this.$$carrierFrequency.push(frequency);
                this.$$carrierPhaseCorrection.push(0);
            }
        };

        ChannelTransmit.prototype.getSample = function () {
            var sample, cg, i;

            sample = 0;
            for (i = 0; i < this.$$carrierGenerate.length; i++) {
                cg = this.$$carrierGenerate[i];
                sample += cg.getSample();
                cg.nextSample();
            }

            return sample;
        };

        ChannelTransmit.prototype.destroy = function () {
            this.$$carrierGenerate.length = 0;
            this.$$carrierFrequency.length = 0;
            this.$$carrierPhaseCorrection.length = 0;
        };

        return ChannelTransmit;
    }

})();
