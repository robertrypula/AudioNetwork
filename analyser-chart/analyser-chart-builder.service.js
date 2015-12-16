var AnalyserChartBuilder = (function () {
    'use strict';

    _AnalyserChartBuilder.$inject = [];

    function _AnalyserChartBuilder() {

        function build(parentDiv, analyser) {
            return new AnalyserChart(parentDiv, analyser);
        }

        return {
            build: build
        };
    }

    return new _AnalyserChartBuilder();        // TODO change it to dependency injection

})();
