var AudioUtil = (function () {
    'use strict';

    _AudioUtil.$inject = [];

    function _AudioUtil() {

         function findUnitAngle(x, y) {
            var length, q, angle;

            length = Math.sqrt(x * x + y * y);
            length = (length < 0.000001) ? 0.000001 : length;    // prevents from dividing by zero
            q = (y >= 0) ? (x >= 0 ? 0 : 1) : (x < 0 ? 2 : 3);
            switch (q) {
                case 0:
                    angle = Math.asin(y / length);
                    break;
                case 1:
                    angle = Math.asin(-x / length) + 0.5 * Math.PI;
                    break;
                case 2:
                    angle = Math.asin(-y / length) + Math.PI;
                    break;
                case 3:
                    angle = Math.asin(x / length) + 1.5 * Math.PI;
                    break;
            }

            return angle / (2 * Math.PI);
        }

        return {
            findUnitAngle: findUnitAngle
        };
    }

    return new _AudioUtil();        // TODO change it to dependency injection

})();
