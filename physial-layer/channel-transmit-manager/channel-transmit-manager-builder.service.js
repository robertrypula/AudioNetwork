var ChannelTransmitManagerBuilder = (function () {
    'use strict';

    _ChannelTransmitManagerBuilder.$inject = [];

    function _ChannelTransmitManagerBuilder() {

        function build(configuration) {
            return new ChannelTransmitManager(configuration);
        }

        return {
            build: build
        };
    }

    return new _ChannelTransmitManagerBuilder();        // TODO change it to dependency injection

})();
