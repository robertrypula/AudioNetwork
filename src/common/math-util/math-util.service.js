var MathUtil = (function () {
    'use strict';

    _MathUtil.$inject = [];

    function _MathUtil() {

        function asin(v) {
            return Math.asin(v);
        }

        function sqrt(v) {
            return Math.sqrt(v);
        }

        function round(v) {
            return Math.round(v);
        }

        function random() {
            return Math.random();
        }

        function floor(v) {
            return Math.floor(v);
        }

        function sin(v) {
            return Math.sin(v);
        }

        function cos(v) {
            return Math.cos(v);
        }

        function log(v) {
            return Math.log(v);
        }

        function min(v) {
            return Math.min(v);
        }

        function max(v) {
            return Math.max(v);
        }

        return {
            LN10: Math.LN10,
            HALF_PI: 0.5 * Math.PI,
            TWO_PI: 2 * Math.PI,
            PI: Math.PI,
            floor: floor,
            asin: asin,
            sqrt: sqrt,
            round: round,
            random: random,
            sin: sin,
            cos: cos,
            log: log,
            min: min,
            max: max
        };
    }

    return new _MathUtil();        // TODO change it to dependency injection

})();
