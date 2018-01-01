// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerAdapter.RxStateMachineManagerBuilder', _RxStateMachineManagerBuilder);

    _RxStateMachineManagerBuilder.$inject = [
        'PhysicalLayerAdapter.RxStateMachineManager'
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
