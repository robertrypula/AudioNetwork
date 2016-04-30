var AnalyserChartBuilder = (function () {
    'use strict';

    _AnalyserChartBuilder.$inject = [];

    function _AnalyserChartBuilder() {

        function build(parentElement, analyser, height, colorData, colorAxis) {
            return new AnalyserChart(parentElement, analyser, height, colorData, colorAxis);
        }

        return {
            build: build
        };
    }

    return new _AnalyserChartBuilder();        // TODO change it to dependency injection

})();
