var ChannelReceiveManagerBuilder = (function () {
    'use strict';

    _ChannelReceiveManagerBuilder.$inject = [];

    function _ChannelReceiveManagerBuilder() {

        function build(frequencyList) {
            return new ChannelReceiveManager(frequencyList);
        }

        return {
            build: build
        };
    }

    return new _ChannelReceiveManagerBuilder();        // TODO change it to dependency injection

})();
