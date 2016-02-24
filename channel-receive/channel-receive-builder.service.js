var ChannelReceiveBuilder = (function () {
    'use strict';

    _ChannelReceiveBuilder.$inject = [];

    function _ChannelReceiveBuilder() {

        function build(index, configuration) {
            return new ChannelReceive(index, configuration);
        }

        return {
            build: build
        };
    }

    return new _ChannelReceiveBuilder();        // TODO change it to dependency injection

})();
