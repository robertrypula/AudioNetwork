// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

/*
TODO:
    - rename to ConnectSequenceDetector
    - remove sampleNumber
    - remove threshold
    - add connection counter
    - rename signalDecibel to decibelAverageSignal
    - rename noiseDecibel to decibelAverageNoise
    - add code to constructor and remove getCorrelatorCode
    - move public methods to top
    - remove code length from connection details
 */

var ConnectSignalDetector = function (samplePerSymbol, signalThresholdFactor) {
    this.$$samplePerSymbol = samplePerSymbol;
    this.$$connectionInProgress = false;
    this.$$connectionDetail = null;
    this.$$correlator = new Correlator(samplePerSymbol);
    this.$$signalThresholdFactor = signalThresholdFactor;
    this.$$blockHistory = undefined;

    this.$$initializeBlockHistory();
};

ConnectSignalDetector.$$_FIRST_ELEMENT = 0;

ConnectSignalDetector.prototype.getCorrelatorCode = function () {
    return this.$$correlator.getCode();
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

ConnectSignalDetector.prototype.$$sortByCorrelationValue = function (a, b) {
    var
        cvA = a.correlationValue,
        cvB = b.correlationValue;

    return cvA < cvB ? 1 : cvA > cvB ? -1 : 0;
};

ConnectSignalDetector.prototype.$$sortBySignalDecibel = function (a, b) {
    var
        sdA = a.signalDecibel,
        sdB = b.signalDecibel;

    return sdA < sdB ? 1 : sdA > sdB ? -1 : 0;
};

ConnectSignalDetector.prototype.$$sortDecisionList = function (data) {
    var self = this;

    data.sort(function (a, b) {
        return 0 ||
            self.$$sortByCorrelationValue(a, b) ||
            self.$$sortBySignalDecibel(a, b);
    });
};

ConnectSignalDetector.prototype.$$initializeBlockHistory = function () {
    var offset;

    this.$$blockHistory = [];
    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        this.$$blockHistory.push({
            decisionList: [],
            connectSignalJustLost: undefined,
            connectSignalDetected: undefined
        });
    }
};

ConnectSignalDetector.prototype.$$resetBlockHistory = function () {
    var offset, blockHistoryEntry;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        blockHistoryEntry = this.$$blockHistory[offset];
        blockHistoryEntry.decisionList.length = 0;
        blockHistoryEntry.connectSignalJustLost = undefined;
        blockHistoryEntry.connectSignalDetected = undefined;
    }
};

ConnectSignalDetector.prototype.$$getStrongestConnectionDetail = function () {
    var offset, decisionList, innerDecisionList, strongestConnectionDetail;

    decisionList = [];
    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        innerDecisionList = this.$$blockHistory[offset].decisionList;
        if (innerDecisionList.length > 0) {
            this.$$sortDecisionList(innerDecisionList);
            decisionList.push(innerDecisionList[ConnectSignalDetector.$$_FIRST_ELEMENT]);
        }
    }
    this.$$sortDecisionList(decisionList);
    strongestConnectionDetail = decisionList[ConnectSignalDetector.$$_FIRST_ELEMENT];

    return strongestConnectionDetail;
};

ConnectSignalDetector.prototype.$$updateConnectionDetail = function () {
    this.$$connectionDetail = this.$$getStrongestConnectionDetail();
    this.$$connectionDetail.signalThresholdDecibel =
        this.$$connectionDetail.noiseDecibel +
        this.$$signalThresholdFactor * this.$$connectionDetail.signalToNoiseRatio;
    this.$$resetBlockHistory();
    this.$$correlator.reset();
};

ConnectSignalDetector.prototype.$$tryToUpdateConnectionDetail = function () {
    var offset;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        if (this.$$blockHistory[offset].connectSignalJustLost) {
            this.$$updateConnectionDetail();
            return true;
        }
    }

    return false;
};

ConnectSignalDetector.prototype.$$isOngoingConnectionInHistoryBlock = function () {
    var offset, blockHistoryEntry;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        blockHistoryEntry = this.$$blockHistory[offset];
        if (blockHistoryEntry.connectSignalDetected || blockHistoryEntry.connectSignalJustLost) {
            return true;
        }
    }

    return false;
};

ConnectSignalDetector.prototype.handle = function (sampleNumber, signalValue, signalDecibel, noiseDecibel) {
    var
        offset,
        blockHistoryEntry,
        isLastOffsetInSamplingBlock,
        connectSignalDetected,
        connectionDetailJustUpdated,
        lastConnectSignalDetected;

    offset = sampleNumber % this.$$samplePerSymbol;
    blockHistoryEntry = this.$$blockHistory[offset];
    isLastOffsetInSamplingBlock = offset === (this.$$samplePerSymbol - 1);

    this.$$correlator.handle(signalValue, signalDecibel, noiseDecibel);
    connectSignalDetected = this.$$correlator.isCorrelated();

    if (connectSignalDetected) {
        blockHistoryEntry.decisionList.push({
            offset: offset,
            correlationValue: this.$$correlator.getCorrelationValue(),
            correlationCodeLength: this.$$correlator.getCodeLength(),
            signalDecibel: this.$$correlator.getSignalDecibelAverage(),
            noiseDecibel: this.$$correlator.getNoiseDecibelAverage(),
            signalToNoiseRatio: this.$$correlator.getSignalToNoiseRatio(),
            signalThresholdDecibel: undefined   // will be set at $$updateConnectionDetail()
        });
    }
    lastConnectSignalDetected = blockHistoryEntry.connectSignalDetected;
    blockHistoryEntry.connectSignalJustLost = lastConnectSignalDetected && !connectSignalDetected;
    blockHistoryEntry.connectSignalDetected = connectSignalDetected;

    if (isLastOffsetInSamplingBlock) {
        connectionDetailJustUpdated = this.$$tryToUpdateConnectionDetail();
    }

    this.$$connectionInProgress =
        !connectionDetailJustUpdated &&
        this.$$isOngoingConnectionInHistoryBlock();
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
