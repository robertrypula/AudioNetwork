// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.RxStateMachineBuilder', _RxStateMachineBuilder);

    _RxStateMachineBuilder.$inject = [
        'PhysicalLayerAdapter.RxStateMachine'
    ];

    function _RxStateMachineBuilder(
        RxStateMachine
    ) {

        function build(handlerIdleInit, handlerFirstSyncWait, handlerFirstSync, handlerFatalError, handlerIdle, handlerSymbol, handlerSync, handlerGuard, handlerError) {
            return new RxStateMachine(
                handlerIdleInit,
                handlerFirstSyncWait,
                handlerFirstSync,
                handlerFatalError,
                handlerIdle,
                handlerSymbol,
                handlerSync,
                handlerGuard,
                handlerError
            );
        }

        return {
            build: build
        };
    }

})();
