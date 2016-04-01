var AudioNetworkReceiveAdapter = (function () {
    'use strict';

    _AudioNetworkReceiveAdapter.$inject = [];

    function _AudioNetworkReceiveAdapter() {
        var ANRA;

        ANRA = function (audioNetworkPhysicalLayer) {
            this.$$anpl = audioNetworkPhysicalLayer;
            this.$$stateMachine = RxStateMachineBuilder.build();

            this.$$symbolData = [];
            this.$$packetData = [];
        };

        ANRA.prototype.receive = function (channelIndex, carrierDetail, time) {

            return {
                state: 'test'
            }
        };

        return ANRA;
    }

    return _AudioNetworkReceiveAdapter();        // TODO change it to dependency injection

})();
