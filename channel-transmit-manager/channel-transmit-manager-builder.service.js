var ChannelTransmitManagerBuilder = (function () {
    'use strict';

    _ChannelTransmitManagerBuilder.$inject = [];

    function _ChannelTransmitManagerBuilder() {

        function build(frequencyList) {
            return new ChannelTransmitManager(frequencyList);
        }

        return {
            build: build
        };
    }

    return new _ChannelTransmitManagerBuilder();        // TODO change it to dependency injection

})();
