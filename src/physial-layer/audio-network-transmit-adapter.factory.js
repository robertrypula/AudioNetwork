var AudioNetworkTransmitAdapter = (function () {
    'use strict';

    _AudioNetworkTransmitAdapter.$inject = [];

    function _AudioNetworkTransmitAdapter() {
        var ANTA;

        ANTA = function (audioNetworkPhysicalLayer) {
            this.$$anpl = audioNetworkPhysicalLayer;
        };


        ANTA.prototype.destroy = function () {
            
        };

        return ANTA;
    }

    return _AudioNetworkTransmitAdapter();        // TODO change it to dependency injection

})();
