var ChannelReceiveBuilder = (function () {
    'use strict';

    _ChannelReceiveBuilder.$inject = [];

    function _ChannelReceiveBuilder() {

        function build(frequency) {
            return new ChannelReceive(frequency);
        }

        return {
            build: build
        };
    }

    return new _ChannelReceiveBuilder();        // TODO change it to dependency injection

})();
