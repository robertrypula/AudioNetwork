// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.RxInput', _RxInput);

    _RxInput.$inject = [];

    function _RxInput() {
        return {
            MICROPHONE: 'MICROPHONE',
            LOOPBACK: 'LOOPBACK',
            RECORDED_AUDIO: 'RECORDED_AUDIO'
        };
    }

})();
