var ChannelReceiveManagerBuilder = (function () {
    'use strict';

    _ChannelReceiveManagerBuilder.$inject = [];

    function _ChannelReceiveManagerBuilder() {

        function build(configuration, bufferSize) {
            return new ChannelReceiveManager(configuration, bufferSize);
        }

        return {
            build: build
        };
    }

    return new _ChannelReceiveManagerBuilder();        // TODO change it to dependency injection

})();
