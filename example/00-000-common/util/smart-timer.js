// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var SmartTimer;

SmartTimer = function (interval) {
    this.$$interval = null;
    this.$$intervalCounter = null;
    this.$$timeRefference = null;
    this.$$timeoutId = null;

    this.setInterval(interval);
};

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

SmartTimer.prototype.setHandler = function (handler) {
    if (SmartTimer.$$isFunction(handler)) {
        this.$$handler = handler.bind(handler);
    } else {
        this.$$handler = null;
    }
};

SmartTimer.prototype.$$scheduleNext = function () {
    var
        scheduleDate = new Date(this.$$timeRefference),
        now = new Date(),
        millisecondsToAdd,
        difference;

    this.$$intervalCounter++;
    millisecondsToAdd = 1000 * this.$$interval * this.$$intervalCounter;
    scheduleDate.setMilliseconds(
        scheduleDate.getMilliseconds() + millisecondsToAdd
    );
    difference = scheduleDate.getTime() - now.getTime();

    this.$$timeoutId = setTimeout(
        this.$$notifyHandler.bind(this),
        difference
    );
};

SmartTimer.prototype.$$notifyHandler = function () {
    if (this.$$handler) {
        this.$$handler();
    }
    this.$$scheduleNext();
};
