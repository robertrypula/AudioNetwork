var PhysicalLayerInput = (function () {
    'use strict';

    _PhysicalLayerInput.$inject = [];

    function _PhysicalLayerInput() {
        return {
            MICROPHONE: 'MICROPHONE',
            LOOPBACK: 'LOOPBACK',
            RECORDED_AUDIO: 'RECORDED_AUDIO'
        };
    }

    return new _PhysicalLayerInput();        // TODO change it to dependency injection

})();
