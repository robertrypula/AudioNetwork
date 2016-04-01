var AudioNetworkReceiveAdapter = (function () {
    'use strict';

    _AudioNetworkReceiveAdapter.$inject = [];

    function _AudioNetworkReceiveAdapter() {
        var ANRA;

        ANRA = function (audioNetworkPhysicalLayer) {
            this.$$anpl = audioNetworkPhysicalLayer;
            this.$$stateMachine = RxStateMachineBuilder.build();

            this.$$initStateMachine();
        };

        ANRA.prototype.receive = function (channelIndex, carrierDetail, time) {


            return {
                state: 'test'
            }
        };

        ANRA.prototype.$$initStateMachine = function () {
            
        };

        ANRA.prototype.destroy = function () {
            
        };

        return ANRA;
    }

    return _AudioNetworkReceiveAdapter();        // TODO change it to dependency injection

})();
