// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var ConnectCodeDetector = function (samplePerSymbol, code) {
    this.$$samplePerSymbol = samplePerSymbol;
    this.$$connectionInProgress = false;
    this.$$connectionDetail = null;
    this.$$connectionDetailId = 1;
    this.$$correlator = new Correlator(samplePerSymbol, code);
    this.$$blockHistory = undefined;
    this.$$sampleNumber = 0;

    this.$$initializeBlockHistory();
};

ConnectCodeDetector.$$_FIRST_ELEMENT = 0;

ConnectCodeDetector.prototype.isConnectionInProgress = function () {
    return this.$$connectionInProgress;
};

ConnectCodeDetector.prototype.isConnected = function () {
    return !!this.$$connectionDetail;
};

ConnectCodeDetector.prototype.getConnectionDetail = function () {
    return this.$$connectionDetail;
};

ConnectCodeDetector.prototype.handle = function (signalValue, signalDecibel, noiseDecibel) {
    var
        offset,
        blockHistoryEntry,
        isLastOffsetInSamplingBlock,
        connectSignalDetected,
        connectionDetailJustUpdated,
        lastConnectSignalDetected;

    offset = this.$$sampleNumber % this.$$samplePerSymbol;
    blockHistoryEntry = this.$$blockHistory[offset];
    isLastOffsetInSamplingBlock = offset === (this.$$samplePerSymbol - 1);

    this.$$correlator.handle(signalValue, signalDecibel, noiseDecibel);
    connectSignalDetected = this.$$correlator.isCorrelated();

    if (connectSignalDetected) {
        blockHistoryEntry.decisionList.push({
            id: undefined,         // will be set later
            offset: offset,
            correlationValue: this.$$correlator.getCorrelationValue(),
            decibelAverageSignal: this.$$correlator.getSignalDecibelAverage(),
            decibelAverageNoise: this.$$correlator.getNoiseDecibelAverage(),
            signalToNoiseRatio: this.$$correlator.getSignalToNoiseRatio()
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

    this.$$sampleNumber++;
};

ConnectCodeDetector.prototype.$$sortByCorrelationValue = function (a, b) {
    return a.correlationValue < b.correlationValue
        ? 1
        : (a.correlationValue > b.correlationValue ? -1 : 0);
};

ConnectCodeDetector.prototype.$$sortBySignalDecibel = function (a, b) {
    return a.signalDecibel < b.signalDecibel
        ? 1
        : (a.signalDecibel > b.signalDecibel ? -1 : 0);
};

ConnectCodeDetector.prototype.$$sortDecisionList = function (data) {
    var self = this;

    data.sort(function (a, b) {
        return 0 ||
            self.$$sortByCorrelationValue(a, b) ||
            self.$$sortBySignalDecibel(a, b);
    });
};

ConnectCodeDetector.prototype.$$initializeBlockHistory = function () {
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

ConnectCodeDetector.prototype.$$resetBlockHistory = function () {
    var offset, blockHistoryEntry;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        blockHistoryEntry = this.$$blockHistory[offset];
        blockHistoryEntry.decisionList.length = 0;
        blockHistoryEntry.connectSignalJustLost = undefined;
        blockHistoryEntry.connectSignalDetected = undefined;
    }
};

ConnectCodeDetector.prototype.$$getStrongestConnectionDetail = function () {
    var offset, decisionList, innerDecisionList, strongestConnectionDetail;

    decisionList = [];
    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        innerDecisionList = this.$$blockHistory[offset].decisionList;
        if (innerDecisionList.length > 0) {
            this.$$sortDecisionList(innerDecisionList);
            decisionList.push(innerDecisionList[ConnectCodeDetector.$$_FIRST_ELEMENT]);
        }
    }
    this.$$sortDecisionList(decisionList);
    strongestConnectionDetail = decisionList[ConnectCodeDetector.$$_FIRST_ELEMENT];

    return strongestConnectionDetail;
};

ConnectCodeDetector.prototype.$$updateConnectionDetail = function () {
    this.$$connectionDetail = this.$$getStrongestConnectionDetail();
    this.$$connectionDetail.id = this.$$connectionDetailId++;
    this.$$resetBlockHistory();
    this.$$correlator.reset();
};

ConnectCodeDetector.prototype.$$tryToUpdateConnectionDetail = function () {
    var offset;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        if (this.$$blockHistory[offset].connectSignalJustLost) {
            this.$$updateConnectionDetail();
            return true;
        }
    }

    return false;
};

ConnectCodeDetector.prototype.$$isOngoingConnectionInHistoryBlock = function () {
    var offset, blockHistoryEntry;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        blockHistoryEntry = this.$$blockHistory[offset];
        if (blockHistoryEntry.connectSignalDetected || blockHistoryEntry.connectSignalJustLost) {
            return true;
        }
    }

    return false;
};
