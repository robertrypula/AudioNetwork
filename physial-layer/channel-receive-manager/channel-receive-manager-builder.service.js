var ChannelReceiveManagerBuilder = (function () {
    'use strict';

    _ChannelReceiveManagerBuilder.$inject = [];

    function _ChannelReceiveManagerBuilder() {

        function build(configuration) {
            return new ChannelReceiveManager(configuration);
        }

        return {
            build: build
        };
    }

    return new _ChannelReceiveManagerBuilder();        // TODO change it to dependency injection

})();
