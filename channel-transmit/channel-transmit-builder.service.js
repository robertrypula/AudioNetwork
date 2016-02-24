var ChannelTransmitBuilder = (function () {
    'use strict';

    _ChannelTransmitBuilder.$inject = [];

    function _ChannelTransmitBuilder() {

        function build(index, configuration) {
            return new ChannelTransmit(index, configuration);
        }

        return {
            build: build
        };
    }

    return new _ChannelTransmitBuilder();        // TODO change it to dependency injection

})();
