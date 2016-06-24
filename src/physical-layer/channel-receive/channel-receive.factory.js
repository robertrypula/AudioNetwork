// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.ChannelReceive', _ChannelReceive);

    _ChannelReceive.$inject = [
        'PhysicalLayer.Audio',
        'PhysicalLayer.CarrierRecoveryBuilder',
        'Common.MathUtil'
    ];

    function _ChannelReceive(
        Audio,                        // TODO remove that depencency - it's here only for sample rate
        CarrierRecoveryBuilder,
        MathUtil
    ) {
        var ChannelReceive;

        ChannelReceive = function (index, configuration) {
            this.$$carrierRecovery = [];
            this.$$carrierFrequency = [];
            this.$$carrierPhaseCorrection = [];
            this.$$notifyInterval = null;
            this.$$notifyHandler = null;
            this.$$index = index;

            this.configure(configuration);
        };

        ChannelReceive.OFDM_INDEX_OUT_OF_RANGE_EXCEPTION = 'OFDM index out of range: ';

        ChannelReceive.prototype.configure = function (configuration) {
            var i, cr, samplePerPeriod, frequency;

            for (i = 0; i < configuration.ofdmSize; i++) {
                frequency = configuration.baseFrequency + i * configuration.ofdmFrequencySpacing;
                samplePerPeriod = Audio.getSampleRate() / frequency;
                cr = CarrierRecoveryBuilder.build(samplePerPeriod, configuration.dftWindowSize);
                this.$$carrierRecovery.push(cr);
                this.$$carrierFrequency.push(frequency);
                this.$$carrierPhaseCorrection.push(0);
            }

            this.$$notifyInterval = configuration.notifyInterval;
            this.$$notifyHandler = configuration.notifyHandler;
        };

        ChannelReceive.prototype.$$checkOfdmIndex = function (ofdmIndex) {
            if (ofdmIndex < 0 || ofdmIndex >= this.$$carrierRecovery.length) {
                throw ChannelReceive.OFDM_INDEX_OUT_OF_RANGE_EXCEPTION + ofdmIndex;
            }
        };

        ChannelReceive.prototype.getOfdmSize = function () {
            return this.$$carrierRecovery.length;
        };

        ChannelReceive.prototype.getRxPhaseCorrection = function (ofdmIndex) {
            this.$$checkOfdmIndex(ofdmIndex);

            return this.$$carrierPhaseCorrection[ofdmIndex];
        };

        ChannelReceive.prototype.getFrequency = function (ofdmIndex) {
            this.$$checkOfdmIndex(ofdmIndex);

            return this.$$carrierFrequency[ofdmIndex];
        };

        ChannelReceive.prototype.setRxPhaseCorrection = function (ofdmIndex, phaseCorrection) {
            this.$$checkOfdmIndex(ofdmIndex);

            this.$$carrierPhaseCorrection[ofdmIndex] = phaseCorrection - MathUtil.floor(phaseCorrection);
        };

        ChannelReceive.prototype.setFrequency = function (ofdmIndex, frequency) {
            var samplePerPeriod;

            this.$$checkOfdmIndex(ofdmIndex);

            samplePerPeriod = Audio.getSampleRate() / frequency;
            this.$$carrierRecovery[ofdmIndex].setSamplePerPeriod(samplePerPeriod);
            this.$$carrierFrequency[ofdmIndex] = frequency;
        };

        ChannelReceive.prototype.handleSample = function (sample, sampleNumberGlobal, blockBeginTime, sampleNumberInBlock) {
            var notifyIteration, cr, cd, i, carrierDetail, sampleTimeOffsetInBlock;

            notifyIteration = (sampleNumberGlobal % this.$$notifyInterval === 0);

            if (notifyIteration) {
                carrierDetail = [];
            }

            for (i = 0; i < this.$$carrierRecovery.length; i++) {
                cr = this.$$carrierRecovery[i];
                cr.handleSample(sample);
                if (notifyIteration) {
                    cd = cr.getCarrierDetail();
                    cd.phase = cd.phase - this.$$carrierPhaseCorrection[i];
                    cd.phase = cd.phase - MathUtil.floor(cd.phase);
                    carrierDetail.push(cd);
                }
            }

            if (notifyIteration) {
                sampleTimeOffsetInBlock = sampleNumberInBlock / Audio.getSampleRate();

                this.$$notifyHandler(
                    this.$$index, 
                    carrierDetail,
                    blockBeginTime + sampleTimeOffsetInBlock
                );
            }
        };

        ChannelReceive.prototype.destroy = function () {
            this.$$carrierRecovery.length = 0;
            this.$$carrierFrequency.length = 0;
            this.$$carrierPhaseCorrection.length = 0;
        };

        return ChannelReceive;
    }

})();
