var AudioNetworkReceiveAdapter = (function () {
    'use strict';

    _AudioNetworkReceiveAdapter.$inject = [];

    function _AudioNetworkReceiveAdapter() {
        var ANRA;

        ANRA = function (audioNetworkPhysicalLayer) {
            this.$$anpl = audioNetworkPhysicalLayer;
            this.$$stateMachine = RxStateMachineBuilder.build(
                this.$$handlerIdle,
                this.$$handlerSymbol,
                this.$$handlerSync,
                this.$$handlerGuard
            );

            this.$$symbolData = [];
            this.$$packetData = [];
        };

        ANRA.prototype.$$handlerIdle = function (time, symbolData) {

        };

        ANRA.prototype.$$handlerSymbol = function (time, symbolData) {

        };

        ANRA.prototype.$$handlerSync = function (time, symbolData) {

        };

        ANRA.prototype.$$handlerGuard = function (time, symbolData) {

        };

        ANRA.prototype.receive = function (channelIndex, carrierDetail, time, pskSize) {
            var state, testSymbolData;

            pskSize = 4;
            testSymbolData = {
                symbol: (
                    carrierDetail[0].powerDecibel > -6 ?
                    Math.round(carrierDetail[0].phase * pskSize) % pskSize :
                    null
                ),
                phase: carrierDetail[0].phase,
                powerDecibel: carrierDetail[0].powerDecibel
            };

            state = this.$$stateMachine.getState(testSymbolData, time);

            return {
                state: state + ' - ' + testSymbolData.symbol
            };
        };

        return ANRA;
    }

    return _AudioNetworkReceiveAdapter();        // TODO change it to dependency injection

})();
