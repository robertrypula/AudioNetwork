var RxHandlerBuilder = (function () {
    'use strict';

    _RxHandlerBuilder.$inject = [];

    function _RxHandlerBuilder() {

        function build(rxConstellationDiagram, rxHandler) {
            return new RxHandler(rxConstellationDiagram, rxHandler);
        }

        return {
            build: build
        };
    }

    return new _RxHandlerBuilder();        // TODO change it to dependency injection

})();
