var CarrierGenerate = (function () {
    'use strict';

    _CarrierGenerate.$inject = [];

    function _CarrierGenerate() {
        var CG;

        CG = function (samplePerPeriod, samplePerFade) {
            this.$$samplePerPeriod = samplePerPeriod;
            this.$$omega = 2 * Math.PI / samplePerPeriod; // revolutions per sample
            this.$$samplePerFade = samplePerFade;
            this.$$sampleNumber = 0;
            this.$$queue = [];
            this.$$sampleComputed = null;
            this.$$currentCarrier = {
                data: null,
                sampleNumberStart: null,
                sampleNumberEnd: null
            };
        };

        CG.prototype.$$sampleCompute = function () {
            var 
                fadeFactor, 
                currentCarrierData,
                fadePositionStart,
                fadePositionEnd
            ;

            fadeFactor = 1.0;
            currentCarrierData = this.$$currentCarrier.data;

            if (currentCarrierData) {
                fadePositionStart = this.$$sampleNumber - this.$$currentCarrier.sampleNumberStart;
                fadePositionEnd = this.$$currentCarrier.sampleNumberEnd - this.$$sampleNumber;

                fadePositionStart /= this.$$samplePerFade;
                fadePositionEnd /= this.$$samplePerFade;

                if (fadePositionStart >= 0 && fadePositionStart <= 1) {
                    fadeFactor = AudioUtil.unitFadeIn(fadePositionStart);
                }
                if (fadePositionEnd >= 0 && fadePositionEnd <= 1) {
                    fadeFactor = AudioUtil.unitFadeIn(fadePositionEnd);
                }

                // console.log(this.$$sampleNumber, fadePositionStart, fadePositionEnd, fadeFactor);

                this.$$sampleComputed = (
                    fadeFactor *
                    currentCarrierData.amplitude *
                    Math.sin(
                        this.$$omega * this.$$sampleNumber - 2 * Math.PI * currentCarrierData.phase
                    )
                );
            } else {
                this.$$sampleComputed = 0;
            }
        };

        CG.prototype.$$grabCurrentCarrier = function () {
            var fromQueue, isSameAsBefore;

            fromQueue = AudioUtil.queuePop(this.$$queue);

            // console.log('this.$$sampleNumber', this.$$sampleNumber);

            isSameAsBefore = fromQueue === this.$$currentCarrier.data
            this.$$currentCarrier.data = fromQueue;
            if (!isSameAsBefore && fromQueue) {
                this.$$currentCarrier.sampleNumberStart = this.$$sampleNumber;
                this.$$currentCarrier.sampleNumberEnd = this.$$currentCarrier.sampleNumberStart + fromQueue.duration;
            }

            if (!fromQueue) {
                this.$$currentCarrier.sampleNumberStart = null;
                this.$$currentCarrier.sampleNumberEnd = null;
            }
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
            AudioUtil.queueAdd(this.$$queue, carrierData, function (queueItem, item) {
                queueItem.amplitude = item.amplitude;
                queueItem.phase = item.phase;
            });
        };

        return CG;
    }

    return _CarrierGenerate();        // TODO change it to dependency injection

})();
