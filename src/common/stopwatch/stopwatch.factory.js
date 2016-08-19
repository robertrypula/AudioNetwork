// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.Stopwatch', _Stopwatch);

    _Stopwatch.$inject = [
    ];

    function _Stopwatch(
    ) {
        var Stopwatch;

        Stopwatch = function () {
            this.$$running = false;
            this.$$timeStart = undefined;
            this.$$timeEnd = undefined;
        };

        Stopwatch.STOPWATCH_ALREADY_STARTED_EXCEPTION = 'Stopwatch already started';
        Stopwatch.STOPWATCH_ALREADY_STOPPED_EXCEPTION = 'Stopwatch already stopped';
        Stopwatch.RESET_BEFORE_CALLING_START_EXCEPTION = 'Reset stopwatch before calling start() again';
        Stopwatch.STOPWATCH_WAS_NOT_STARTED_EXCEPTION = 'stopwatch was not started';

        Stopwatch.$$_MILLISECOND_IN_SECOND = 1000;

        Stopwatch.prototype.reset = function () {
            this.$$running = false;
            this.$$timeStart = undefined;
            this.$$timeEnd = undefined;

            return this;
        };

        Stopwatch.prototype.start = function () {
            if (this.$$running) {
                throw Stopwatch.STOPWATCH_ALREADY_STARTED_EXCEPTION;
            }

            if (this.$$timeStart && this.$$timeEnd) {
                throw Stopwatch.RESET_BEFORE_CALLING_START_EXCEPTION;
            }

            this.$$timeStart = new Date();
            this.$$running = true;

            return this;
        };

        Stopwatch.prototype.stop = function () {
            if (!this.$$timeStart) {
                throw Stopwatch.STOPWATCH_WAS_NOT_STARTED_EXCEPTION;
            }

            if (!this.$$running) {
                throw Stopwatch.STOPWATCH_ALREADY_STOPPED_EXCEPTION;
            }

            this.$$timeEnd = new Date();
            this.$$running = false;

            return this;
        };

        Stopwatch.prototype.getDuration = function (inSeconds) {
            var
                millisecondDifference,
                now = new Date();

            if (!this.$$timeStart) {
                throw Stopwatch.STOPWATCH_WAS_NOT_STARTED_EXCEPTION;
            }

            if (this.$$running) {
                millisecondDifference = now.getTime() - this.$$timeStart.getTime();
            } else {
                millisecondDifference = this.$$timeEnd.getTime() - this.$$timeStart.getTime();
            }

            return inSeconds ? millisecondDifference / Stopwatch.$$_MILLISECOND_IN_SECOND : millisecondDifference;
        };

        return Stopwatch;
    }

})();
