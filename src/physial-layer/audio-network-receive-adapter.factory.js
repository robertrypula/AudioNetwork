var AudioNetworkReceiveAdapter = (function () {
    'use strict';

    _AudioNetworkReceiveAdapter.$inject = [];

    _AudioNetworkReceiveAdapter.SYMBOL_STATE_MAX_DURATION_TIME = 0.25;
    _AudioNetworkReceiveAdapter.GUARD_STATE_MAX_DURATION_TIME = 0.25;
    _AudioNetworkReceiveAdapter.SYNC_STATE_MAX_DURATION_TIME = 8.0;
    _AudioNetworkReceiveAdapter.POWER_THRESHOLD = 0;            // TODO to delete later
    _AudioNetworkReceiveAdapter.SYNC_PREAMBLE = true;
    _AudioNetworkReceiveAdapter.INITIAL_NOISE_LEVEL = -100;
    _AudioNetworkReceiveAdapter.INITIAL_SIGNAL_LEVEL = 0;

    function _AudioNetworkReceiveAdapter() {
        var ANRA;

        ANRA = function (audioNetworkPhysicalLayer) {
            var 
                _anra = _AudioNetworkReceiveAdapter,
                channelSize,
                stateMachineManager,
                i
            ;

            this.$$audioNetworkPhysicalLayer = audioNetworkPhysicalLayer;
            
            channelSize = this.$$audioNetworkPhysicalLayer.getRxChannelSize(),
            this.$$stateMachineManager = [];
            for (i = 0; i < channelSize; i++) {
                stateMachineManager = RxStateMachineManagerBuilder.build(
                    i, 
                    this.$$audioNetworkPhysicalLayer
                );
                // stateMachineManager.setSymbolStateMaxDurationTime(_anra.SYMBOL_STATE_MAX_DURATION_TIME);
                // stateMachineManager.setGuardStateMaxDurationTime(_anra.GUARD_STATE_MAX_DURATION_TIME);
                // stateMachineManager.setSyncStateMaxDurationTime(_anra.SYNC_STATE_MAX_DURATION_TIME);

                this.$$stateMachineManager.push(stateMachineManager);
            }


            this.$$powerThreshold = _anra.POWER_THRESHOLD;         // TODO to delete later
            this.$$syncPreamble = _anra.SYNC_PREAMBLE;
            this.$$packetReceiveHandler = null;

            this.$$waitingForSync = true;
            this.$$averageNoiseLevel = _AudioNetworkReceiveAdapter.INITIAL_NOISE_LEVEL;
            this.$$averageSignalLevel = _AudioNetworkReceiveAdapter.INITIAL_SIGNAL_LEVEL;
            this.$$packetData = [];
            this.$$symbolData = [];
        };

        ANRA.prototype.setSymbolDuration = function (value) {
            // this.$$stateMachine.setSymbolStateMaxDurationTime(value);
        };

        ANRA.prototype.setGuardInverval = function (value) {
            // this.$$stateMachine.setGuardStateMaxDurationTime(value);
        };

        ANRA.prototype.setSyncPreamble = function (value) {
            // this.$$syncPreamble = !!value;
        };

        ANRA.prototype.setPacketReceiveHandler = function (cb) {
            if (typeof cb === 'function') {
                this.$$packetReceiveHandler = cb;
            } else {
                this.$$packetReceiveHandler = null;
            }
        };

        ANRA.prototype.receive = function (channelIndex, carrierDetail, time, pskSize) {
            var state, testSymbolData;

            pskSize = 4;
            testSymbolData = {
                symbol: (
                    carrierDetail[0].powerDecibel > this.$$powerThreshold ?
                    Math.round(carrierDetail[0].phase * pskSize) % pskSize :
                    null
                ),
                phase: carrierDetail[0].phase,
                powerDecibel: carrierDetail[0].powerDecibel
            };

            state = this.$$stateMachineManager[channelIndex].getState(testSymbolData, time);

            return {
                state: state + ' - ' + testSymbolData.symbol
            };
        };

        return ANRA;
    }

    return _AudioNetworkReceiveAdapter();        // TODO change it to dependency injection

})();
