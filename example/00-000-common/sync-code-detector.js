// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var SyncCodeDetector = function (samplePerSymbol, code) {
    this.$$samplePerSymbol = samplePerSymbol;
    this.$$syncInProgress = false;
    this.$$sync = this.$$getEmptySync();
    this.$$syncId = SyncCodeDetector.$$_INITIAL_ID;
    this.$$correlator = new Correlator(samplePerSymbol, code);
    this.$$blockHistory = undefined;
    this.$$sampleNumber = SyncCodeDetector.$$_INITIAL_SAMPLE_NUMBER;

    this.$$initializeBlockHistory();
};

SyncCodeDetector.$$_FIRST_ELEMENT = 0;
SyncCodeDetector.$$_INITIAL_ID = 1;
SyncCodeDetector.$$_INITIAL_SAMPLE_NUMBER = 0;

SyncCodeDetector.prototype.isSyncInProgress = function () {
    return this.$$syncInProgress;
};

SyncCodeDetector.prototype.getSync = function () {
    return this.$$sync;
};

SyncCodeDetector.prototype.handle = function (codeValue, signalDecibel, noiseDecibel) {
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

SyncCodeDetector.prototype.$$sortByCorrelationValue = function (a, b) {
    return a.correlationValue < b.correlationValue
        ? 1
        : (a.correlationValue > b.correlationValue ? -1 : 0);
};

SyncCodeDetector.prototype.$$sortBySignalDecibel = function (a, b) {
    return a.signalDecibel < b.signalDecibel
        ? 1
        : (a.signalDecibel > b.signalDecibel ? -1 : 0);
};

SyncCodeDetector.prototype.$$sortDecisionList = function (data) {
    var self = this;

    data.sort(function (a, b) {
        return 0 ||
            self.$$sortByCorrelationValue(a, b) ||
            self.$$sortBySignalDecibel(a, b);
    });
};

SyncCodeDetector.prototype.$$initializeBlockHistory = function () {
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

SyncCodeDetector.prototype.$$resetBlockHistory = function () {
    var offset, blockHistoryEntry;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        blockHistoryEntry = this.$$blockHistory[offset];
        blockHistoryEntry.decisionList.length = 0;
        blockHistoryEntry.syncCodeJustLost = undefined;
        blockHistoryEntry.syncCodeDetected = undefined;
    }
};

SyncCodeDetector.prototype.$$getStrongestSync = function () {
    var offset, decisionList, innerDecisionList, strongestSync;

    decisionList = [];
    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        innerDecisionList = this.$$blockHistory[offset].decisionList;
        if (innerDecisionList.length > 0) {
            this.$$sortDecisionList(innerDecisionList);
            decisionList.push(innerDecisionList[SyncCodeDetector.$$_FIRST_ELEMENT]);
        }
    }
    this.$$sortDecisionList(decisionList);
    strongestSync = decisionList[SyncCodeDetector.$$_FIRST_ELEMENT];

    return strongestSync;
};

SyncCodeDetector.prototype.$$updateSync = function () {
    this.$$sync = this.$$getStrongestSync();
    this.$$sync.id = this.$$syncId++;
    this.$$resetBlockHistory();
    this.$$correlator.reset();
};

SyncCodeDetector.prototype.$$tryToUpdateSync = function () {
    var offset;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        if (this.$$blockHistory[offset].syncCodeJustLost) {
            this.$$updateSync();
            return true;
        }
    }

    return false;
};

SyncCodeDetector.prototype.$$isSyncInProgressInHistoryBlock = function () {
    var offset, blockHistoryEntry;

    for (offset = 0; offset < this.$$samplePerSymbol; offset++) {
        blockHistoryEntry = this.$$blockHistory[offset];
        if (blockHistoryEntry.syncCodeDetected || blockHistoryEntry.syncCodeJustLost) {
            return true;
        }
    }

    return false;
};

SyncCodeDetector.prototype.$$getEmptySync = function () {
    return {
        id: null,
        symbolSamplingPointOffset: undefined,
        correlationValue: undefined,
        signalDecibelAverage: undefined,
        noiseDecibelAverage: undefined,
        signalToNoiseRatio: undefined
    };
};
