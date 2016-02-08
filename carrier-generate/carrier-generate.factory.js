var CarrierGenerate = (function () {
    'use strict';

    _CarrierGenerate.$inject = [];

    function _CarrierGenerate() {
        var CG;

        CG = function (samplePerPeriod, samplePerFade) {
            /*
            // TODO fix this condition!
            if (samplePerPeriod < 2 * samplePerFade) {
                throw 'samplePerFade overlaps with samplePerFade';
            }
            */

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
            fadePositionStart = (this.$$sampleNumber - this.$$currentCarrier.sampleNumberStart) / this.$$samplePerFade;
            fadePositionEnd = (this.$$currentCarrier.sampleNumberEnd - this.$$sampleNumber) / this.$$samplePerFade;

            if (fadePositionStart >= 0 && fadePositionStart <= 1) {
                fadeFactor = AudioUtil.unitFade(fadePositionStart);
            } else {
                if (fadePositionEnd >= 0 && fadePositionEnd <= 1) {
                    fadeFactor = AudioUtil.unitFade(fadePositionEnd);
                }
            }

            // console.log(this.$$sampleNumber, fadePositionStart, fadePositionEnd, fadeFactor);

            this.$$sampleComputed = (
                fadeFactor *
                currentCarrierData.amplitude *
                Math.sin(
                    this.$$omega * this.$$sampleNumber
                    - 2 * Math.PI * currentCarrierData.phase
                )
            );
        };

        CG.prototype.$$grabCurrentCarrier = function () {
            var fromQueue, isSameAsBefore;

            fromQueue = AudioUtil.queuePop(this.$$queue);

            // console.log('this.$$sampleNumber', this.$$sampleNumber);

            if (fromQueue) {
                // console.log('from queue');
                isSameAsBefore = (fromQueue === this.$$currentCarrier.data);
                if (!isSameAsBefore) {
                    // console.log('  --> from queue NOT SAME AS BEFORE');
                    this.$$currentCarrier.data = fromQueue;
                    this.$$currentCarrier.sampleNumberStart = this.$$sampleNumber;
                    this.$$currentCarrier.sampleNumberEnd = this.$$currentCarrier.sampleNumberStart + fromQueue.duration;
                }
            } else {
                // console.log('from queue NULL');
                this.$$currentCarrier.data = null;
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
