var RxStateMachineManagerBuilder = (function () {
    'use strict';

    _RxStateMachineManagerBuilder.$inject = [];

    function _RxStateMachineManagerBuilder() {

        function build(channelIndex, packetReceiveHandler, frequencyUpdateHandler, phaseCorrectionUpdateHandler) {
            return new RxStateMachineManager(
                channelIndex,
                packetReceiveHandler, 
                frequencyUpdateHandler, 
                phaseCorrectionUpdateHandler
            );
        }

        return {
            build: build
        };
    }

    return new _RxStateMachineManagerBuilder();        // TODO change it to dependency injection

})();
