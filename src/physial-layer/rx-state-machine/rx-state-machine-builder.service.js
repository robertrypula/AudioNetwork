var RxStateMachineBuilder = (function () {
    'use strict';

    _RxStateMachineBuilder.$inject = [];

    function _RxStateMachineBuilder() {

        function build(handlerIdle, handlerSymbol, handlerSync, handlerGuard) {
            return new RxStateMachine(
                handlerIdle,
                handlerSymbol,
                handlerSync,
                handlerGuard
            );
        }

        return {
            build: build
        };
    }

    return new _RxStateMachineBuilder();        // TODO change it to dependency injection

})();
