// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var RxSyncDetector = function (samplePerSymbol, correlationCode) {
    this.$$samplePerSymbol = samplePerSymbol;
    this.$$rxSyncInProgress = false;
    this.$$rxSyncDspDetails = RxSyncDetector.$$getEmpty();
    this.$$id = RxSyncDetector.$$_INITIAL_ID;
    this.$$correlator = new Correlator(samplePerSymbol, correlationCode);
    this.$$blockHistory = undefined;
    this.$$rxSampleNumber = RxSyncDetector.$$_INITIAL_RX_SAMPLE_NUMBER;

    this.$$initializeBlockHistory();
};

RxSyncDetector.$$_FIRST_ELEMENT = 0;
RxSyncDetector.$$_INITIAL_ID = 1;
RxSyncDetector.$$_INITIAL_RX_SAMPLE_NUMBER = 0;

RxSyncDetector.prototype.isRxSyncInProgress = function () {
    return this.$$rxSyncInProgress;
};

RxSyncDetector.prototype.getRxSyncDspDetails = function () {
    return this.$$rxSyncDspDetails;
};

RxSyncDetector.prototype.handle = function (correlationCodeValue, signalDecibel, noiseDecibel) {
    var
        offset,
        blockHistoryEntry,
        isLastOffsetInSamplingBlock,
        syncDetected,
        syncJustUpdated,
        lastSyncDetected,
        syncCandidate;

    offset = this.$$rxSampleNumber % this.$$samplePerSymbol;
    blockHistoryEntry = this.$$blockHistory[offset];
    isLastOffsetInSamplingBlock = offset === (this.$$samplePerSymbol - 1);

    this.$$correlator.handle(correlationCodeValue, signalDecibel, noiseDecibel);
    syncDetected = this.$$correlator.isCorrelated();

    if (syncDetected) {
        syncCandidate = RxSyncDetector.$$getEmpty();    // TODO create dedicated class
        syncCandidate.rxSymbolSamplingPointOffset = offset;
        syncCandidate.rxCorrelationValue = this.$$correlator.getCorrelationValue();
        syncCandidate.rxCorrelationCodeLength = this.$$correlator.getCorrelationCodeLength();
        syncCandidate.rxSignalDecibelAverage = this.$$correlator.getSignalDecibelAverage();
        syncCandidate.rxNoiseDecibelAverage = this.$$correlator.getNoiseDecibelAverage();
        syncCandidate.rxSignalToNoiseRatio = this.$$correlator.getSignalToNoiseRatio();
        
        blockHistoryEntry.decisionList.push(syncCandidate);
    }
    lastSyncDetected = blockHistoryEntry.syncDetected;
    blockHistoryEntry.syncJustLost = lastSyncDetected && !syncDetected;
    blockHistoryEntry.syncDetected = syncDetected;

    if (isLastOffsetInSamplingBlock) {
        syncJustUpdated = this.$$tryToUpdateSync();
    }

    this.$$rxSyncInProgress =
        !syncJustUpdated &&
        this.$$isRxSyncInProgressInHistoryBlock();

    this.$$rxSampleNumber++;
};

RxSyncDetector.prototype.$$sortByCorrelationValue = function (a, b) {
    return a.rxCorrelationValue < b.rxCorrelationValue
        ? 1
        : (a.rxCorrelationValue > b.rxCorrelationValue ? -1 : 0);
};

RxSyncDetector.prototype.$$sortBySignalDecibel = function (a, b) {
    return a.rxSignalDecibelAverage < b.rxSignalDecibelAverage
        ? 1
        : (a.rxSignalDecibelAverage > b.rxSignalDecibelAverage ? -1 : 0);
};

RxSyncDetector.prototype.$$sortDecisionList = function (data) {
    var self = this;

    data.sort(function (a, b) {
        return 0 ||
            self.$$sortByCorrelationValue(a, b) ||
            self.$$sortBySignalDecibel(a, b);
    });
};

RxSyncDetector.prototype.$$initializeBlockHistory = function () {
    var offset;

    this.$$blockHistory = [];
    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        this.$$blockHistory.push({
            decisionList: [],
            syncJustLost: undefined,
            syncDetected: undefined
        });
    }
};

RxSyncDetector.prototype.$$resetBlockHistory = function () {
    var offset, blockHistoryEntry;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        blockHistoryEntry = this.$$blockHistory[offset];
        blockHistoryEntry.decisionList.length = 0;
        blockHistoryEntry.syncJustLost = undefined;
        blockHistoryEntry.syncDetected = undefined;
    }
};

RxSyncDetector.prototype.$$getTheBestRxSyncDspDetails = function () {
    var offset, decisionList, innerDecisionList, strongestSync;

    decisionList = [];
    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        innerDecisionList = this.$$blockHistory[offset].decisionList;
        if (innerDecisionList.length > 0) {
            this.$$sortDecisionList(innerDecisionList);
            decisionList.push(innerDecisionList[RxSyncDetector.$$_FIRST_ELEMENT]);
        }
    }
    this.$$sortDecisionList(decisionList);
    strongestSync = decisionList[RxSyncDetector.$$_FIRST_ELEMENT];

    return strongestSync;
};

RxSyncDetector.prototype.$$updateSync = function () {
    this.$$rxSyncDspDetails = this.$$getTheBestRxSyncDspDetails();
    this.$$rxSyncDspDetails.id = this.$$id++;
    this.$$resetBlockHistory();
    this.$$correlator.reset();
};

RxSyncDetector.prototype.$$tryToUpdateSync = function () {
    var offset;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        if (this.$$blockHistory[offset].syncJustLost) {
            this.$$updateSync();
            return true;
        }
    }

    return false;
};

RxSyncDetector.prototype.$$isRxSyncInProgressInHistoryBlock = function () {
    var offset, blockHistoryEntry;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        blockHistoryEntry = this.$$blockHistory[offset];
        if (blockHistoryEntry.syncDetected || blockHistoryEntry.syncJustLost) {
            return true;
        }
    }

    return false;
};

RxSyncDetector.$$getEmpty = function () {
    return {
        id: null,
        rxSymbolSamplingPointOffset: undefined,
        rxCorrelationValue: undefined,
        rxCorrelationCodeLength: undefined,
        rxSignalDecibelAverage: undefined,
        rxNoiseDecibelAverage: undefined,
        rxSignalToNoiseRatio: undefined
    };
};
