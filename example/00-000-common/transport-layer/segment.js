// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Segment = (function () {
    var Segment;

    Segment = function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
        this.$$acknowledgementFlag = false;
        this.$$synchronizeFlag = 0;
        this.$$sequenceNumber = 0;
        this.$$acknowledgementNumber = 0;
    };

    return Segment;
})();
