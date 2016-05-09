(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.PhysicalLayerInput', _PhysicalLayerInput);

    _PhysicalLayerInput.$inject = [];

    function _PhysicalLayerInput() {
        return {
            MICROPHONE: 'MICROPHONE',
            LOOPBACK: 'LOOPBACK',
            RECORDED_AUDIO: 'RECORDED_AUDIO'
        };
    }

})();
