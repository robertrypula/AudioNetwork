(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ChannelReceiveBuilder', _ChannelReceiveBuilder);

    _ChannelReceiveBuilder.$inject = [
        'PhysicalLayer.ChannelReceive'
    ];

    function _ChannelReceiveBuilder(
        ChannelReceive
    ) {

        function build(index, configuration) {
            return new ChannelReceive(index, configuration);
        }

        return {
            build: build
        };
    }

})();
