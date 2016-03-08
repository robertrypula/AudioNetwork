var DelayLoopHandlerBuilder = (function () {
    'use strict';

    _DelayLoopHandlerBuilder.$inject = [];

    function _DelayLoopHandlerBuilder() {

        function build(rxConstellationDiagram, rxHandler) {
            return new DelayLoopHandler(rxConstellationDiagram, rxHandler);
        }

        return {
            build: build
        };
    }

    return new _DelayLoopHandlerBuilder();        // TODO change it to dependency injection

})();
