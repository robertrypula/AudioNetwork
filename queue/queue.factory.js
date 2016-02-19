var Queue = (function () {
    'use strict';

    _Queue.$inject = [];

    function _Queue() {
        var Q;

        Q = function (sizeMax) {
            this.$$sizeMax = sizeMax;
            this.$$data = [];
            this.$$positionStart = 0;
            this.$$positionEnd = 0;
            this.$$size = 0;

            this.$$data.length = sizeMax;
        };

        Q.prototype.push = function (value) {
            if (this.$$size === this.$$sizeMax) {
                return false;
            }

            this.$$data[this.$$positionEnd] = value;
            this.$$positionEnd = (this.$$positionEnd + 1) % this.$$sizeMax;
            this.$$size++;

            return true;
        };

        Q.prototype.pop = function () {
            var result;

            if (this.$$size === 0) {
                return null;
            }
            result = this.$$data[this.$$positionStart];
            this.$$positionStart = (this.$$positionStart + 1) % this.$$sizeMax;
            this.$$size--;

            return result;
        };

        Q.prototype.getItem = function (index) {
            if (index >= this.$$size) {
                return null;
            }

            return this.$$data[(this.$$positionStart + index) % this.$$sizeMax];
        };

        Q.prototype.getSize = function () {
            return this.$$size;
        };

        Q.prototype.isFull = function () {
            return this.$$size === this.$$sizeMax;
        };

        return Q;
    }

    return _Queue();        // TODO change it to dependency injection

})();
