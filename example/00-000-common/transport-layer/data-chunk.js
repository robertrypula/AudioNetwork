// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var DataChunk = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var DataChunk;

    DataChunk = function (payload) {
        this.$$payload = payload;
        this.$$txSegment = [];
        this.$$rxSegment = [];
    };

    return DataChunk;
})();
