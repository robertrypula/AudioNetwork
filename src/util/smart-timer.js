// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Util.SmartTimer', SmartTimer);

    SmartTimer.$inject = [];

    function SmartTimer() {
        var SmartTimer;

        SmartTimer = function (interval) {
            this.$$interval = null;
            this.$$intervalCounter = null;
            this.$$timeRefference = null;
            this.$$timeoutId = null;
            this.$$listener = undefined;

            this.setInterval(interval);
        };

        SmartTimer.$$_MILISECOND_IN_SECOND = 1000;

        SmartTimer.$$isFunction = function (variable) {
            return typeof variable === 'function';
        };

        SmartTimer.prototype.setInterval = function (interval) {
            if (this.$$timeoutId !== null) {
                clearTimeout(this.$$timeoutId);
            }
            this.$$interval = interval;
            this.$$intervalCounter = 0;
            this.$$timeRefference = new Date();
            this.$$scheduleNext();
        };

        SmartTimer.prototype.setListener = function (listener) {
            if (SmartTimer.$$isFunction(listener)) {
                this.$$listener = listener.bind(listener);
            } else {
                this.$$listener = null;
            }
        };

        SmartTimer.prototype.$$scheduleNext = function () {
            var
                scheduleDate = new Date(this.$$timeRefference),
                now = new Date(),
                millisecondsToAdd,
                difference;

            this.$$intervalCounter++;
            millisecondsToAdd = SmartTimer.$$_MILISECOND_IN_SECOND * this.$$interval * this.$$intervalCounter;
            scheduleDate.setMilliseconds(
                scheduleDate.getMilliseconds() + millisecondsToAdd
            );
            difference = scheduleDate.getTime() - now.getTime();

            this.$$timeoutId = setTimeout(
                this.$$notifyListener.bind(this),
                difference
            );
        };

        SmartTimer.prototype.$$notifyListener = function () {
            if (this.$$listener) {
                this.$$listener();
            }
            this.$$scheduleNext();
        };

        return SmartTimer;
    }

})();
