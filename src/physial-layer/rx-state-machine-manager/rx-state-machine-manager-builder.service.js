var RxStateMachineManagerBuilder = (function () {
    'use strict';

    _RxStateMachineManagerBuilder.$inject = [];

    function _RxStateMachineManagerBuilder() {

        function build(channelIndex, audioNetworkPhysicalLayer) {
            return new RxStateMachineManager(channelIndex, audioNetworkPhysicalLayer);
        }

        return {
            build: build
        };
    }

    return new _RxStateMachineManagerBuilder();        // TODO change it to dependency injection

})();
