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

        function sin(v) {
            return Math.sin(v);
        }

        function cos(v) {
            return Math.cos(v);
        }

        function log(v) {
            return Math.log(v);
        }

        return {
            LN10: Math.LN10,
            HALF_PI: 0.5 * Math.PI,
            TWO_PI: 2 * Math.PI,
            PI: Math.PI,
            asin: asin,
            sqrt: sqrt,
            round: round,
            random: random,
            sin: sin,
            cos: cos,
            log: log
        };
    }

    return new _MathUtil();        // TODO change it to dependency injection

})();
