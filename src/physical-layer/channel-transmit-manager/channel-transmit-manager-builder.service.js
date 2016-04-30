var ChannelTransmitManagerBuilder = (function () {
    'use strict';

    _ChannelTransmitManagerBuilder.$inject = [];

    function _ChannelTransmitManagerBuilder() {

        function build(configuration, bufferSize) {
            return new ChannelTransmitManager(configuration, bufferSize);
        }

        return {
            build: build
        };
    }

    return new _ChannelTransmitManagerBuilder();        // TODO change it to dependency injection

})();
