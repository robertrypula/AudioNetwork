// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var ConnectSignalDetector = function (samplePerSymbol, signalThresholdFactor) {
    this.$$samplePerSymbol = samplePerSymbol;
    this.$$connectionInProgress = false;
    this.$$connectionDetail = null;
    this.$$correlator = new Correlator(samplePerSymbol);
    this.$$signalThresholdFactor = signalThresholdFactor;
    this.$$samplingBlock = [];
};

ConnectSignalDetector.prototype.isConnectionInProgress = function () {
    return this.$$connectionInProgress;
};

ConnectSignalDetector.prototype.isConnected = function () {
    return !!this.$$connectionDetail;
};

ConnectSignalDetector.prototype.getConnectionDetail = function () {
    return this.$$connectionDetail;
};

ConnectSignalDetector.prototype.$$sortConnectionDetail = function (data) {
    data.sort(function (a, b) {
        return 0 ||
            a.correlationValue < b.correlationValue ? 1 : a.correlationValue > b.correlationValue ? -1 : 0 ||
            a.signalDecibel < b.signalDecibel ? 1 : a.signalDecibel > b.signalDecibel ? -1 : 0;
    });
};

ConnectSignalDetector.prototype.$$findStrongestConnectionDetail = function () {
    var offset, decisionList, innerDecisionList;

    if (false && JSON) {
        console.log(
            JSON.stringify(
                this.$$samplingBlock,
                true,
                2
            )
        );
    }

    decisionList = [];
    for (offset = 0; offset < this.$$samplingBlock.length; offset++) {
        innerDecisionList = this.$$samplingBlock[offset].decisionList;
        if (innerDecisionList.length > 0) {
            this.$$sortConnectionDetail(innerDecisionList);
            decisionList.push(innerDecisionList[0]);
        }
    }

    this.$$sortConnectionDetail(decisionList);

    this.$$connectionDetail = decisionList[0];

    if (false && JSON) {
        console.log(
            JSON.stringify(
                this.$$connectionDetail,
                true,
                2
            )
        );
    }
};

ConnectSignalDetector.prototype.handle = function (sampleNumber, signalValue, signalDecibel, noiseDecibel) {
    var
        offset,
        isLastOffsetInSamplingBlock,
        connectSignalDetected,
        lastConnectSignalDetected;

    offset = sampleNumber % this.$$samplePerSymbol;
    isLastOffsetInSamplingBlock = offset === (this.$$samplePerSymbol - 1);
    
    this.$$correlator.handle(signalValue, signalDecibel, noiseDecibel);
    connectSignalDetected = this.$$correlator.isCorrelated();

    if (!this.$$samplingBlock[offset]) {
        // TODO move this initialization to dedicated place
        this.$$samplingBlock[offset] = {
            decisionList: [],
            connectSignalJustLost: undefined,
            connectSignalDetected: undefined
        };
    }

    if (connectSignalDetected) {
        this.$$samplingBlock[offset].decisionList.push({
            offset: offset,
            correlationValue: Math.abs(this.$$correlator.getCorrelationValue()),
            correlationValueMax: this.$$correlator.getCodeLength(),
            signalDecibel: this.$$correlator.getSignalDecibelAverage(),
            noiseDecibel: this.$$correlator.getNoiseDecibelAverage(),
            signalToNoiseRatio: this.$$correlator.getSignalToNoiseRatio(),
            signalThresholdDecibel: undefined
        });
    }
    lastConnectSignalDetected = this.$$samplingBlock[offset].connectSignalDetected;
    this.$$samplingBlock[offset].connectSignalJustLost = lastConnectSignalDetected === true && !connectSignalDetected;
    this.$$samplingBlock[offset].connectSignalDetected = connectSignalDetected;

    if (isLastOffsetInSamplingBlock) {
        for (offset = 0; offset < this.$$samplingBlock.length; offset++) {
            if (this.$$samplingBlock[offset].connectSignalJustLost === true) {
                this.$$findStrongestConnectionDetail();
                this.$$connectionDetail.signalThresholdDecibel =
                    this.$$connectionDetail.noiseDecibel +
                    this.$$signalThresholdFactor * this.$$connectionDetail.signalToNoiseRatio;
                this.$$samplingBlock.length = 0;        // TODO bad reset, refactor
                this.$$correlator.reset();
                break;
            }
        }
    }

    this.$$connectionInProgress = false;
    for (offset = 0; offset < this.$$samplingBlock.length; offset++) {
        if (this.$$samplingBlock[offset].connectSignalDetected === true || this.$$samplingBlock[offset].connectSignalJustLost === true) {
            this.$$connectionInProgress = true;
            // this.$$connectionDetail = null;
            break;
        }
    }
};

/*
var t = new ConnectSignalDetector(3, 0.2);

t.handle(0, null, -20, -100);
t.handle(1, true, -20, -100);
t.handle(2, true, -10, -100);

t.handle(3, null, -20, -100);
t.handle(4, false, -20, -100);
t.handle(5, false, -10, -100);

t.handle(6, null, -20, -100);
t.handle(7, true, -20, -100);
t.handle(8, true, -10, -100);

t.handle(9, null, -20, -100);
t.handle(10, false, -20, -100);
t.handle(11, false, -10, -100);

t.handle(12, null, -20, -100);
t.handle(13, true, -20, -100);
t.handle(14, true, -10, -100);

t.handle(15, null, -20, -100);
t.handle(16, false, -20, -100);
t.handle(17, false, -10, -100);

t.handle(18, null, -20, -100);
t.handle(19, true, -20, -100);
t.handle(20, true, -10, -100);

t.handle(21, null, -20, -100);
t.handle(22, false, -20, -100);
t.handle(23, false, -10, -100);

t.handle(24, null, -20, -100);
t.handle(25, true, -20, -100);
t.handle(26, true, -10, -100);

t.handle(27, null, -20, -100);
t.handle(28, false, -20, -100);
console.log(t, t.$$correlator.getCorrelationValue(), t.isConnected() ? JSON.stringify(t.getConnectionDetail(), true, 2) : '');
t.handle(29, false, -10, -100);
console.log(t, t.$$correlator.getCorrelationValue(), t.isConnected() ? JSON.stringify(t.getConnectionDetail(), true, 2) : '');

t.handle(30, null, -20, -100);
t.handle(31, null, -20, -100);
console.log(t, t.$$correlator.getCorrelationValue(), t.isConnected() ? JSON.stringify(t.getConnectionDetail(), true, 2) : '');
t.handle(32, false, -10, -100);
console.log(t, t.$$correlator.getCorrelationValue(), t.isConnected() ? JSON.stringify(t.getConnectionDetail(), true, 2) : '');
*/
