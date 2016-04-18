var PowerChartBuilder = (function () {
    'use strict';

    _PowerChartBuilder.$inject = [];

    function _PowerChartBuilder() {

        function build(parentElement, width, height) {
            return new PowerChart(parentElement, width, height);
        }

        return {
            build: build
        };
    }

    return new _PowerChartBuilder();        // TODO change it to dependency injection

})();
