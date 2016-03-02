var CarrierRecovery = (function () {
    'use strict';

    _CarrierRecovery.$inject = [];

    function _CarrierRecovery() {
        var CR;

        CR = function (samplePerPeriod, sizeDFT) {
            this.$$queue = QueueBuilder.build(2 * sizeDFT);
            this.$$queueSumReal = 0;
            this.$$queueSumImm = 0;
            this.$$referenceReal = 0;
            this.$$referenceImm = 0;
            this.$$real = 0;
            this.$$imm = 0;
            this.$$power = 0;
            this.$$powerDecibel = 0;
            this.$$phase = 0;

            this.$$samplePerPeriod = null;
            this.$$omega = null;
            this.$$sampleNumber = 0;
            this.setSamplePerPeriod(samplePerPeriod);
        };

        CR.prototype.$$computeReference = function () {
            var x = this.$$omega * this.$$sampleNumber;

            this.$$referenceReal = MathUtil.cos(x);
            this.$$referenceImm = MathUtil.sin(x);
        };

        CR.prototype.$$computeAverage = function (sample) {
            var real, imm, n;

            if (this.$$queue.isFull()) {
                this.$$queueSumReal -= this.$$queue.pop();
                this.$$queueSumImm -= this.$$queue.pop();
            }
            real = this.$$referenceReal * sample;
            imm = this.$$referenceImm * sample;
            this.$$queue.push(real);
            this.$$queue.push(imm);
            this.$$queueSumReal += real;
            this.$$queueSumImm += imm;

            n = this.$$queue.getSize() >>> 1;
            this.$$real = this.$$queueSumReal / n;
            this.$$imm = this.$$queueSumImm / n;
        };

        CR.prototype.$$computePower = function () {
            this.$$power = MathUtil.sqrt(
                this.$$real * this.$$real +
                this.$$imm * this.$$imm
            );
            this.$$powerDecibel = 10 * MathUtil.log(this.$$power) / MathUtil.LN10;
        };

        CR.prototype.$$computePhase = function () {
            this.$$phase = AudioUtil.findUnitAngle(this.$$real, this.$$imm);

            // correct phase to start from positive side of X axis counterclockwise
            this.$$phase = this.$$phase - 0.25;
            if (this.$$phase < 0) {
                this.$$phase += 1;
            }
        };

        CR.prototype.handleSample = function (sample) {
            this.$$computeReference();
            this.$$computeAverage(sample);

            this.$$sampleNumber++;
        };

        CR.prototype.getCarrier = function () {
            this.$$computePower();
            this.$$computePhase();

            return {
                phase: this.$$phase,
                power: this.$$power,
                powerDecibel: this.$$powerDecibel
            };
        };

        CR.prototype.setSamplePerPeriod = function (samplePerPeriod) {
            this.$$samplePerPeriod = samplePerPeriod;
            this.$$omega = MathUtil.TWO_PI / this.$$samplePerPeriod;  // revolutions per sample
            this.$$sampleNumber = 0;
        };

        return CR;
    }

    return _CarrierRecovery();        // TODO change it to dependency injection

})();
