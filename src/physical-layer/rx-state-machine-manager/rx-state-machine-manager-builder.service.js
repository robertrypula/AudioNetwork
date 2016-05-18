// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.RxStateMachineManagerBuilder', _RxStateMachineManagerBuilder);

    _RxStateMachineManagerBuilder.$inject = [
        'PhysicalLayer.RxStateMachineManager'
    ];

    function _RxStateMachineManagerBuilder(
        RxStateMachineManager
    ) {

        function build(channelIndex, packetReceiveHandler, frequencyUpdateHandler, phaseCorrectionUpdateHandler) {
            return new RxStateMachineManager(
                channelIndex,
                packetReceiveHandler, 
                frequencyUpdateHandler, 
                phaseCorrectionUpdateHandler
            );
        }

        return {
            build: build
        };
    }

})();
