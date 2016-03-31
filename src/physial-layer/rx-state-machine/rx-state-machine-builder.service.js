var RxStateMachineBuilder = (function () {
    'use strict';

    _RxStateMachineBuilder.$inject = [];

    function _RxStateMachineBuilder() {

        function build() {
            return new RxStateMachine();
        }

        return {
            build: build
        };
    }

    return new _RxStateMachineBuilder();        // TODO change it to dependency injection

})();
