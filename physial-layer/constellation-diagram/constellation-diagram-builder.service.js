var ConstellationDiagramBuilder = (function () {
    'use strict';

    _ConstellationDiagramBuilder.$inject = [];

    function _ConstellationDiagramBuilder() {

        function build(parentDiv, queue, width, height) {
            return new ConstellationDiagram(parentDiv, queue, width, height);
        }

        return {
            build: build
        };
    }

    return new _ConstellationDiagramBuilder();        // TODO change it to dependency injection

})();
