// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var DataChunk = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var DataChunk;

    DataChunk = function (payload) {
        this.$$payload = payload;
        this.$$txSegment = [];
        this.$$rxSegment = [];
    };

    DataChunk.prototype.getTxAttemptNumber = function () {
        return this.$$payload;
    };

    DataChunk.prototype.getLastTxSegment = function () {
        return this.$$txSegment.length > 0
            ? this.$$txSegment[this.$$txSegment.length - 1]
            : null;
    };

    DataChunk.prototype.getPayload = function () {
        return this.$$payload;
    };

    DataChunk.prototype.addTxSegment = function (txSegment) {
        this.$$txSegment.push(txSegment);
    };

    DataChunk.prototype.txSegmentLength = function () {
        return this.$$txSegment.length;
    };

    DataChunk.prototype.isLastTxSegmentInProgress = function () {
        if (this.$$txSegment.length === 0) {
            return false;
        }

        return !this.$$txSegment[this.$$txSegment.length - 1].getTxConfirmed();
    };

    return DataChunk;
})();
