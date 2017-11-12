// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.RxHandlerBuilder', _RxHandlerBuilder);

    _RxHandlerBuilder.$inject = [
        'PhysicalLayer.RxHandler'
    ];

    function _RxHandlerBuilder(
        RxHandler
    ) {

        function build(rxConstellationDiagram, rxExternalHandler) {
            return new RxHandler(rxConstellationDiagram, rxExternalHandler);
        }

        return {
            build: build
        };
    }

})();
