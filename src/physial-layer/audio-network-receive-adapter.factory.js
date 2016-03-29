var AudioNetworkReceiveAdapter = (function () {
    'use strict';

    _AudioNetworkReceiveAdapter.$inject = [];

    function _AudioNetworkReceiveAdapter() {
        var ANRA;

        ANRA = function (audioNetworkPhysicalLayer) {
            this.$$anpl = audioNetworkPhysicalLayer;
        };

        ANRA.prototype.receive = function (channelIndex, carrierDetail, time) {
            
        };


        ANRA.prototype.destroy = function () {
            
        };

        return ANRA;
    }

    return _AudioNetworkReceiveAdapter();        // TODO change it to dependency injection

})();
