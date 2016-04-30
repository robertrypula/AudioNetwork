var RxHandlerBuilder = (function () {
    'use strict';

    _RxHandlerBuilder.$inject = [];

    function _RxHandlerBuilder() {

        function build(rxConstellationDiagram, rxExternalHandler) {
            return new RxHandler(rxConstellationDiagram, rxExternalHandler);
        }

        return {
            build: build
        };
    }

    return new _RxHandlerBuilder();        // TODO change it to dependency injection

})();
