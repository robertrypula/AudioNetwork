(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ChannelTransmitBuilder', _ChannelTransmitBuilder);

    _ChannelTransmitBuilder.$inject = [
        'PhysicalLayer.ChannelTransmit'
    ];

    function _ChannelTransmitBuilder(
        ChannelTransmit
    ) {

        function build(index, configuration) {
            return new ChannelTransmit(index, configuration);
        }

        return {
            build: build
        };
    }

})();
