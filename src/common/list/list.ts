// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
/*
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Util.List', List);

    List.$inject = [];

    function List() {
        var List;

        List = function (sizeMax) {
            this.$$data = [];
            this.$$positionStart = null;
            this.$$positionEnd = null;
            this.$$size = null;
            this.$$sizeMax = null;
            this.setSizeMax(sizeMax);
        };

        List.prototype.clone = function () {
            var
                buffer = new List(this.$$sizeMax),
                dataLength = this.$$data.length,
                i;

            buffer.$$positionStart = this.$$positionStart;
            buffer.$$positionEnd = this.$$positionEnd;
            buffer.$$size = this.$$size;

            for (i = 0; i < dataLength; i++) {
                buffer[i] = this.$$data[i];
            }

            return buffer;
        };

        List.prototype.setSizeMax = function (sizeMax) {
            this.$$positionStart = 0;
            this.$$positionEnd = 0;
            this.$$size = 0;
            this.$$sizeMax = sizeMax;
            this.$$data.length = 0;        // drop all data
            this.$$data.length = sizeMax;
        };

        List.prototype.push = function (value) {
            if (this.$$size === this.$$sizeMax) {
                return false;
            }

            this.$$data[this.$$positionEnd] = value;
            this.$$positionEnd = (this.$$positionEnd + 1) % this.$$sizeMax;
            this.$$size++;

            return true;
        };

        List.prototype.pushEvenIfFull = function (value) {
            if (this.isFull()) {
                this.pop();
            }
            this.push(value);
        };

        List.prototype.pop = function () {
            var result;

            if (this.$$size === 0) {
                return null;
            }
            result = this.$$data[this.$$positionStart];
            this.$$positionStart = (this.$$positionStart + 1) % this.$$sizeMax;
            this.$$size--;

            return result;
        };

        List.prototype.getItem = function (index) {
            if (index >= this.$$size || index < 0) {
                return null;
            }

            return this.$$data[(this.$$positionStart + index) % this.$$sizeMax];
        };

        List.prototype.getSize = function () {
            return this.$$size;
        };

        List.prototype.getSizeMax = function () {
            return this.$$sizeMax;
        };

        List.prototype.isFull = function () {
            return this.$$size === this.$$sizeMax;
        };

        List.prototype.getAll = function () {
            var i, result = [];

            for (i = 0; i < this.getSize(); i++) {
                result.push(
                    this.getItem(i)
                );
            }

            return result;
        };

        List.prototype.fillWith = function (value) {
            var i;

            for (i = 0; i < this.getSizeMax(); i++) {
                this.pushEvenIfFull(value);
            }
        };

        return List;
    }

})();
*/
