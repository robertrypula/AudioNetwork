// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.CarrierRecovery', _CarrierRecovery);

    _CarrierRecovery.$inject = [
        'Common.QueueBuilder',
        'Common.MathUtil',
        'Common.Util',
        'Common.ComplexBuilder'
    ];

    function _CarrierRecovery(
        QueueBuilder,
        MathUtil,
        Util,
        ComplexBuilder
    ) {
        var CarrierRecovery;

        CarrierRecovery = function (samplePerPeriod, samplePerDftWindow) {
            this.$$samplePerDftWindow = undefined;
            this.$$complexQueue = undefined;
            this.$$complexQueueSum = undefined;
            this.setSamplePerDftWindow(samplePerDftWindow);

            this.$$samplePerPeriod = undefined;
            this.$$omega = undefined;
            this.$$sampleNumber = undefined;
            this.setSamplePerPeriod(samplePerPeriod);
        };

        CarrierRecovery.prototype.$$getUnitComplex = function () {
            var r = this.$$omega * this.$$sampleNumber;

            return ComplexBuilder.build(
                -MathUtil.cos(r),
                MathUtil.sin(r)
            );
        };

        CarrierRecovery.prototype.handleSample = function (sample) {
            var oldComplex, newComplex;

            if (this.$$complexQueue.isFull()) {
                oldComplex = this.$$complexQueue.pop();
                this.$$complexQueueSum.sub(oldComplex);
            }
            newComplex = this.$$getUnitComplex();
            newComplex.mulScalar(sample);
            this.$$complexQueue.push(newComplex);
            this.$$complexQueueSum.add(newComplex);
            this.$$sampleNumber++;
        };

        CarrierRecovery.prototype.getCarrierDetail = function () {
            var complex = ComplexBuilder.copy(this.$$complexQueueSum);

            complex.divScalar(this.$$complexQueue.getSize());

            return {
                phase: complex.findUnitAngle(),
                powerDecibel: Util.convertToDecibel(complex.getAbsoluteValue())
            };
        };

        CarrierRecovery.prototype.setSamplePerDftWindow = function (samplePerDftWindow) {
            if (samplePerDftWindow === this.$$samplePerDftWindow) {
                return false;
            }
            this.$$samplePerDftWindow = samplePerDftWindow;
            this.$$complexQueue = QueueBuilder.build(samplePerDftWindow);
            this.$$complexQueueSum = ComplexBuilder.build(0, 0);

            return true;
        };

        CarrierRecovery.prototype.setSamplePerPeriod = function (samplePerPeriod) {
            if (samplePerPeriod === this.$$samplePerPeriod) {
                return false;
            }
            this.$$samplePerPeriod = samplePerPeriod;
            this.$$omega = MathUtil.TWO_PI / this.$$samplePerPeriod;  // revolutions per sample
            this.$$sampleNumber = 0;

            return true;
        };

        return CarrierRecovery;
    }

})();
