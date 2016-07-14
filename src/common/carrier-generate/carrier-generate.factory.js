// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.CarrierGenerate', _CarrierGenerate);

    _CarrierGenerate.$inject = [
        'Common.MathUtil',
        'Common.Util'
    ];

    function _CarrierGenerate(
        MathUtil,
        Util
    ) {
        var CarrierGenerate;

        CarrierGenerate = function (samplePerPeriod, samplePerFade) {
            this.$$samplePerFade = samplePerFade;
            this.$$queue = [];
            this.$$sampleComputed = null;
            this.$$currentCarrier = {
                data: null,
                sampleNumberStart: null,
                sampleNumberEnd: null
            };

            this.$$samplePerPeriod = null;
            this.$$omega = null;
            this.$$sampleNumber = 0;
            this.$$phaseCorrection = 0;
            this.setSamplePerPeriod(samplePerPeriod);
        };

        CarrierGenerate.prototype.$$sampleCompute = function () {
            var
                currentCarrierData = this.$$currentCarrier.data,
                fadeFactor,
                fadePositionStart,
                fadePositionEnd
            ;

            if (!currentCarrierData) {
                this.$$sampleComputed = 0;
                return;
            }

            fadeFactor = 1.0;
            if (this.$$samplePerFade > 0) {
                fadePositionStart = (this.$$sampleNumber - this.$$currentCarrier.sampleNumberStart) / this.$$samplePerFade;
                fadePositionEnd = (this.$$currentCarrier.sampleNumberEnd - this.$$sampleNumber) / this.$$samplePerFade;

                if (fadePositionStart >= 0 && fadePositionStart <= 1) {
                    fadeFactor = Util.unitFade(fadePositionStart);
                } else {
                    if (fadePositionEnd >= 0 && fadePositionEnd <= 1) {
                        fadeFactor = Util.unitFade(fadePositionEnd);
                    }
                }
            }

            this.$$sampleComputed = (
                fadeFactor *
                currentCarrierData.amplitude *
                MathUtil.sin(
                    this.$$omega * this.$$sampleNumber
                    - MathUtil.TWO_PI * (currentCarrierData.phase - this.$$phaseCorrection)
                )
            );
        };

        CarrierGenerate.prototype.$$grabCurrentCarrier = function () {
            var fromQueue, isSameAsBefore;

            fromQueue = Util.queuePop(this.$$queue);
            if (fromQueue) {
                isSameAsBefore = (fromQueue === this.$$currentCarrier.data);
                if (!isSameAsBefore) {
                    this.$$currentCarrier.data = fromQueue;
                    this.$$currentCarrier.sampleNumberStart = this.$$sampleNumber;
                    this.$$currentCarrier.sampleNumberEnd = (
                        this.$$currentCarrier.sampleNumberStart + fromQueue.duration
                    );
                }
            } else {
                this.$$currentCarrier.data = null;
                this.$$currentCarrier.sampleNumberStart = null;
                this.$$currentCarrier.sampleNumberEnd = null;
            }
        };

        CarrierGenerate.prototype.setPhaseCorrection = function (phaseCorrection) {
            this.$$phaseCorrection = phaseCorrection;
        };

        CarrierGenerate.prototype.nextSample = function () {
            this.$$sampleNumber++;
            this.$$sampleComputed = null;
        };

        CarrierGenerate.prototype.getSample = function () {
            if (this.$$sampleComputed) {
                return this.$$sampleComputed;
            }

            this.$$grabCurrentCarrier();
            this.$$sampleCompute();

            return this.$$sampleComputed;
        };

        CarrierGenerate.prototype.addToQueue = function (carrierData) {
            Util.queueAdd(
                this.$$queue,
                carrierData,
                function (queueItem, item) {
                    queueItem.amplitude = item.amplitude;
                    queueItem.phase = item.phase;
                }
            );
        };

        CarrierGenerate.prototype.reset = function () {
            this.$$sampleNumber = 0;
        };

        CarrierGenerate.prototype.setSamplePerPeriod = function (samplePerPeriod) {
            if (samplePerPeriod === this.$$samplePerPeriod) {
                return false;
            }
            this.$$samplePerPeriod = samplePerPeriod;
            this.$$omega = MathUtil.TWO_PI / this.$$samplePerPeriod;  // revolutions per sample
            this.$$sampleNumber = 0;
            
            return true;
        };

        return CarrierGenerate;
    }

})();
