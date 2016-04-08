var RxStateMachineManagerBuilder = (function () {
    'use strict';

    _RxStateMachineManagerBuilder.$inject = [];

    function _RxStateMachineManagerBuilder() {

        function build(channelIndex, audioNetworkPhysicalLayer, packetReceiveHandler) {
            return new RxStateMachineManager(
                channelIndex,
                audioNetworkPhysicalLayer,
                packetReceiveHandler
            );
        }

        return {
            build: build
        };
    }

    return new _RxStateMachineManagerBuilder();        // TODO change it to dependency injection

})();
