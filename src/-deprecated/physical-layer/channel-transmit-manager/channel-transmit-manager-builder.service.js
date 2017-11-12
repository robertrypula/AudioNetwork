// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ChannelTransmitManagerBuilder', _ChannelTransmitManagerBuilder);

    _ChannelTransmitManagerBuilder.$inject = [
        'PhysicalLayer.ChannelTransmitManager'
    ];

    function _ChannelTransmitManagerBuilder(
        ChannelTransmitManager
    ) {

        function build(configuration, bufferSize) {
            return new ChannelTransmitManager(configuration, bufferSize);
        }

        return {
            build: build
        };
    }

})();
