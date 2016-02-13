var FAST_MODE = 1;

var CarrierRecovery = (function () {
    'use strict';

    _CarrierRecovery.$inject = [];

    function _CarrierRecovery() {
        var CR;

        CR = function (samplePerPeriod, sizeDFT) {
            this.$$sizeDFT = sizeDFT;
            this.$$sampleNumber = 0;
            this.$$history = [];
            this.$$queueReal = QueueBuilder.build(sizeDFT);
            this.$$queueImm = QueueBuilder.build(sizeDFT);
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
            this.setSamplePerPeriod(samplePerPeriod);
        };

        CR.prototype.$$computeReference = function () {
            var x = this.$$omega * this.$$sampleNumber;

            this.$$referenceReal = Math.cos(x);
            this.$$referenceImm = Math.sin(x);
        };

        CR.prototype.$$addToHistory = function (sample) {
            this.$$history.push({
                real: this.$$referenceReal * sample,
                imm: this.$$referenceImm * sample
            });

            if (this.$$history.length > this.$$sizeDFT) {
                this.$$history.splice(0, 1);
            }
        };

        CR.prototype.$$computeAverage = function (sample) {
            var
                real,
                imm,
                n,
                history,
                i
            ;

            if (this.$$queueReal.isFull()) {
                this.$$queueSumReal -= this.$$queueReal.pop();
                this.$$queueSumImm -= this.$$queueImm.pop();
            }
            real = this.$$referenceReal * sample;
            imm = this.$$referenceImm * sample;
            this.$$queueReal.push(real);
            this.$$queueImm.push(imm);
            this.$$queueSumReal += real;
            this.$$queueSumImm += imm;

            real = this.$$queueSumReal / this.$$queueReal.getSize();
            imm = this.$$queueSumImm / this.$$queueImm.getSize();

            if (!FAST_MODE) {
                n = this.$$history.length;
                this.$$real = 0;
                this.$$imm = 0;

                for (i = 0; i < n; i++) {
                    history = this.$$history[i];
                    this.$$real += history.real;
                    this.$$imm += history.imm;
                }

                this.$$real = this.$$real / n;
                this.$$imm = this.$$imm / n;


                if (
                    Math.abs(this.$$real - real) > 0.000000001 ||
                    Math.abs(this.$$imm - imm) > 0.000000001
                ) {
                    console.log(
                        this.$$real, real, this.$$imm, imm
                    );
                    throw 'DATA NOT EQUAL';
                }
            } else {
                this.$$real = real;
                this.$$imm = imm;
            }
        };

        CR.prototype.$$computePower = function () {
            this.$$power = Math.sqrt(
                this.$$real * this.$$real +
                this.$$imm * this.$$imm
            );
            this.$$powerDecibel = 10 * Math.log(this.$$power) / Math.LN10;
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
            if (!FAST_MODE) {
                this.$$addToHistory(sample);
            }
            this.$$computeAverage(sample);
            this.$$computePower();
            this.$$computePhase();

            this.$$sampleNumber++;
        };

        CR.prototype.getCarrier = function () {
            return {
                phase: this.$$phase,
                power: this.$$power,
                powerDecibel: this.$$powerDecibel,
                real: this.$$real,
                imm: this.$$imm
            };
        };

        CR.prototype.setSamplePerPeriod = function (samplePerPeriod) {
            this.$$samplePerPeriod = samplePerPeriod;
            this.$$omega = (2 * Math.PI) / this.$$samplePerPeriod;  // revolutions per sample
            this.$$history.length = 0;
            this.$$sampleNumber = 0;
        };

        CR.prototype.setSizeDFT = function (sizeDFT) {
            this.$$sizeDFT = sizeDFT;
            this.$$history.length = 0;
            this.$$sampleNumber = 0;
        };

        return CR;
    }

    return _CarrierRecovery();        // TODO change it to dependency injection

})();
