var ConstellationDiagramBuilder = (function () {
    'use strict';

    _ConstellationDiagramBuilder.$inject = [];

    function _ConstellationDiagramBuilder() {

        function build(parentElement, queue, width, height, colorAxis, colorHistoryPoint) {
            return new ConstellationDiagram(parentElement, queue, width, height, colorAxis, colorHistoryPoint);
        }

        return {
            build: build
        };
    }

    return new _ConstellationDiagramBuilder();        // TODO change it to dependency injection

})();
