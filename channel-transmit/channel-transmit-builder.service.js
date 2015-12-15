var ChannelTransmitBuilder = (function () {
    'use strict';

    _ChannelTransmitBuilder.$inject = [];

    function _ChannelTransmitBuilder() {

        function build(frequency) {
            return new ChannelTransmit(frequency);
        }

        return {
            build: build
        };
    }

    return new _ChannelTransmitBuilder();        // TODO change it to dependency injection

})();
