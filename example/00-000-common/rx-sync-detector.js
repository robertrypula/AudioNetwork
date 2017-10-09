// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var RxSyncDetector = function (samplePerSymbol, code) {
    this.$$samplePerSymbol = samplePerSymbol;
    this.$$syncInProgress = false;
    this.$$sync = this.$$getEmptySync();
    this.$$syncId = RxSyncDetector.$$_INITIAL_ID;
    this.$$correlator = new Correlator(samplePerSymbol, code);
    this.$$blockHistory = undefined;
    this.$$sampleNumber = RxSyncDetector.$$_INITIAL_SAMPLE_NUMBER;

    this.$$initializeBlockHistory();
};

RxSyncDetector.$$_FIRST_ELEMENT = 0;
RxSyncDetector.$$_INITIAL_ID = 1;
RxSyncDetector.$$_INITIAL_SAMPLE_NUMBER = 0;

RxSyncDetector.prototype.isSyncInProgress = function () {
    return this.$$syncInProgress;
};

RxSyncDetector.prototype.getSync = function () {
    return this.$$sync;
};

RxSyncDetector.prototype.handle = function (codeValue, signalDecibel, noiseDecibel) {
    var
        offset,
        blockHistoryEntry,
        isLastOffsetInSamplingBlock,
        syncCodeDetected,
        syncJustUpdated,
        lastSyncCodeDetected,
        syncCandidate;

    offset = this.$$sampleNumber % this.$$samplePerSymbol;
    blockHistoryEntry = this.$$blockHistory[offset];
    isLastOffsetInSamplingBlock = offset === (this.$$samplePerSymbol - 1);

    this.$$correlator.handle(codeValue, signalDecibel, noiseDecibel);
    syncCodeDetected = this.$$correlator.isCorrelated();

    if (syncCodeDetected) {
        syncCandidate = this.$$getEmptySync();
        syncCandidate.symbolSamplingPointOffset = offset;
        syncCandidate.correlationValue = this.$$correlator.getCorrelationValue();
        syncCandidate.signalDecibelAverage = this.$$correlator.getSignalDecibelAverage();
        syncCandidate.noiseDecibelAverage = this.$$correlator.getNoiseDecibelAverage();
        syncCandidate.signalToNoiseRatio = this.$$correlator.getSignalToNoiseRatio();
        
        blockHistoryEntry.decisionList.push(syncCandidate);
    }
    lastSyncCodeDetected = blockHistoryEntry.syncCodeDetected;
    blockHistoryEntry.syncCodeJustLost = lastSyncCodeDetected && !syncCodeDetected;
    blockHistoryEntry.syncCodeDetected = syncCodeDetected;

    if (isLastOffsetInSamplingBlock) {
        syncJustUpdated = this.$$tryToUpdateSync();
    }

    this.$$syncInProgress =
        !syncJustUpdated &&
        this.$$isSyncInProgressInHistoryBlock();

    this.$$sampleNumber++;
};

RxSyncDetector.prototype.$$sortByCorrelationValue = function (a, b) {
    return a.correlationValue < b.correlationValue
        ? 1
        : (a.correlationValue > b.correlationValue ? -1 : 0);
};

RxSyncDetector.prototype.$$sortBySignalDecibel = function (a, b) {
    return a.signalDecibelAverage < b.signalDecibelAverage
        ? 1
        : (a.signalDecibelAverage > b.signalDecibelAverage ? -1 : 0);
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
            syncCodeJustLost: undefined,
            syncCodeDetected: undefined
        });
    }
};

RxSyncDetector.prototype.$$resetBlockHistory = function () {
    var offset, blockHistoryEntry;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        blockHistoryEntry = this.$$blockHistory[offset];
        blockHistoryEntry.decisionList.length = 0;
        blockHistoryEntry.syncCodeJustLost = undefined;
        blockHistoryEntry.syncCodeDetected = undefined;
    }
};

RxSyncDetector.prototype.$$getStrongestSync = function () {
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
    this.$$sync = this.$$getStrongestSync();
    this.$$sync.id = this.$$syncId++;
    this.$$resetBlockHistory();
    this.$$correlator.reset();
};

RxSyncDetector.prototype.$$tryToUpdateSync = function () {
    var offset;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        if (this.$$blockHistory[offset].syncCodeJustLost) {
            this.$$updateSync();
            return true;
        }
    }

    return false;
};

RxSyncDetector.prototype.$$isSyncInProgressInHistoryBlock = function () {
    var offset, blockHistoryEntry;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        blockHistoryEntry = this.$$blockHistory[offset];
        if (blockHistoryEntry.syncCodeDetected || blockHistoryEntry.syncCodeJustLost) {
            return true;
        }
    }

    return false;
};

RxSyncDetector.prototype.$$getEmptySync = function () {
    return {
        id: null,
        symbolSamplingPointOffset: undefined,
        correlationValue: undefined,
        signalDecibelAverage: undefined,
        noiseDecibelAverage: undefined,
        signalToNoiseRatio: undefined
    };
};
