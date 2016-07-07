// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.Queue', _Queue);

    _Queue.$inject = [
        'Common.MathUtil'
    ];

    function _Queue(
        MathUtil
    ) {
        var Queue;

        Queue = function (sizeMax) {
            this.$$sizeMax = sizeMax;
            this.$$data = [];
            this.$$positionStart = 0;
            this.$$positionEnd = 0;
            this.$$size = 0;
            this.$$hash = 0;

            this.$$data.length = sizeMax;
        };

        Queue.prototype.$$generateNewHash = function () {
            this.$$hash = MathUtil.random() * 1000000;
        };

        Queue.prototype.getHash = function () {
            return this.$$hash;
        };

        Queue.prototype.push = function (value) {
            if (this.$$size === this.$$sizeMax) {
                return false;
            }

            this.$$data[this.$$positionEnd] = value;
            this.$$positionEnd = (this.$$positionEnd + 1) % this.$$sizeMax;
            this.$$size++;

            this.$$generateNewHash();

            return true;
        };

        Queue.prototype.pushEvenIfFull = function (value) {
            if (this.isFull()) {
                this.pop();
            }
            this.push(value);
        };

        Queue.prototype.pop = function () {
            var result;

            if (this.$$size === 0) {
                return null;
            }
            result = this.$$data[this.$$positionStart];
            this.$$positionStart = (this.$$positionStart + 1) % this.$$sizeMax;
            this.$$size--;

            this.$$generateNewHash();

            return result;
        };

        Queue.prototype.getItem = function (index) {
            if (index >= this.$$size) {
                return null;
            }

            return this.$$data[(this.$$positionStart + index) % this.$$sizeMax];
        };

        Queue.prototype.getSize = function () {
            return this.$$size;
        };

        Queue.prototype.getSizeMax = function () {
            return this.$$sizeMax;
        };

        Queue.prototype.isFull = function () {
            return this.$$size === this.$$sizeMax;
        };

        return Queue;
    }

})();
