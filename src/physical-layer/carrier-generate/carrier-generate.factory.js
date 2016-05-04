var CarrierGenerate = (function () {
    'use strict';

    _CarrierGenerate.$inject = [];

    function _CarrierGenerate() {
        var CG;

        CG = function (samplePerPeriod, samplePerFade) {
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

        CG.prototype.$$sampleCompute = function () {
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

        CG.prototype.$$grabCurrentCarrier = function () {
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

        CG.prototype.setPhaseCorrection = function (phaseCorrection) {
            this.$$phaseCorrection = phaseCorrection;
        };

        CG.prototype.nextSample = function () {
            this.$$sampleNumber++;
            this.$$sampleComputed = null;
        };

        CG.prototype.getSample = function () {
            if (this.$$sampleComputed) {
                return this.$$sampleComputed;
            }

            this.$$grabCurrentCarrier();
            this.$$sampleCompute();

            return this.$$sampleComputed;
        };

        CG.prototype.addToQueue = function (carrierData) {
            Util.queueAdd(
                this.$$queue,
                carrierData,
                function (queueItem, item) {
                    queueItem.amplitude = item.amplitude;
                    queueItem.phase = item.phase;
                }
            );
        };

        CG.prototype.setSamplePerPeriod = function (samplePerPeriod) {
            this.$$samplePerPeriod = samplePerPeriod;
            this.$$omega = MathUtil.TWO_PI / this.$$samplePerPeriod;  // revolutions per sample
            this.$$sampleNumber = 0;
        };

        return CG;
    }

    return _CarrierGenerate();        // TODO change it to dependency injection

})();
