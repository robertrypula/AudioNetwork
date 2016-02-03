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
            var fadeFactor, currentCarrierData;

            fadeFactor = 1.0;
            currentCarrierData = this.$$currentCarrier.data;

            if (!currentCarrierData) {
                return 0;
            }

            this.$$sampleComputed = (
                fadeFactor *
                currentCarrierData.amplitude *
                Math.sin(
                    this.$$omega * this.$$sampleNumber - 2 * Math.PI * currentCarrierData.phase
                )
            );
        };

        CG.prototype.$$grabCurrentCarrier = function () {
            this.$$currentCarrier.data = AudioUtil.queuePop(this.$$queue);
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
