var RxStateMachineManager = (function () {
    'use strict';

    _RxStateMachineManager.$inject = [];

    _RxStateMachineManager.SYNC_STATE_MAX_DURATION_TIME = 8.0;
    _RxStateMachineManager.INITIAL_POWER_THRESHOLD = 0;
    _RxStateMachineManager.OFDM_PILOT_SIGNAL_INDEX = 0;

    _RxStateMachineManager.NO_INPUT_POWER = -99;                         // TODO, move to some common place

    _RxStateMachineManager.AVERAGE_NOISE_LEVEL_HISTORY_SIZE = 3 * 25;    // TODO, take it from config
    _RxStateMachineManager.AVERAGE_SIGNAL_LEVEL_HISTORY_SIZE = 3 * 25;

    function _RxStateMachineManager() {
        var RSMM;

        RSMM = function (channelIndex, audioNetworkPhysicalLayer, packetReceiveHandler) {
            this.$$channelIndex = channelIndex;
            this.$$audioNetworkPhysicalLayer = audioNetworkPhysicalLayer;
            this.$$packetReceiveHandler = packetReceiveHandler;
            this.$$stateMachine = RxStateMachineBuilder.build(
                this.$$handlerIdleInit.bind(this),
                this.$$handlerSignalInit.bind(this),
                this.$$handlerIdle.bind(this),
                this.$$handlerSymbol.bind(this),
                this.$$handlerSync.bind(this),
                this.$$handlerGuard.bind(this),
                this.$$handlerError.bind(this)
            );
            this.$$stateMachine.setSyncStateMaxDurationTime(_RxStateMachineManager.SYNC_STATE_MAX_DURATION_TIME);

            this.$$currentData = null;

            this.$$syncPreamble = null;
            this.$$pskSize = null;
            this.$$waitingForSync = true;

            this.$$averageNoiseLevel = null;
            this.$$averageNoiseLevelHistory = [];
            this.$$averageSignalLevel = null;
            this.$$averageSignalLevelHistory = [];
            this.$$powerThreshold = _RxStateMachineManager.INITIAL_POWER_THRESHOLD;

            this.$$dataPacket = [];
            this.$$dataSymbol = [];
            this.$$initializeStorage();
        };

        RSMM.prototype.setSymbolStateMaxDurationTime = function (value) {
            this.$$stateMachine.setSymbolStateMaxDurationTime(value);
        };

        RSMM.prototype.setGuardStateMaxDurationTime  = function (value) {
            this.$$stateMachine.setGuardStateMaxDurationTime(value);
        };

        RSMM.prototype.setSyncPreamble  = function (value) {
            this.$$syncPreamble = value;
        };

        RSMM.prototype.setPskSize  = function (value) {
            this.$$pskSize = value;
        };

        RSMM.prototype.$$initializeStorage = function () {
            var ofdmSize, i;

            this.$$dataPacket.length = 0;
            this.$$dataSymbol.length = 0;
            ofdmSize = this.$$audioNetworkPhysicalLayer.getRxChannelOfdmSize(this.$$channelIndex);
            for (i = 0; i < ofdmSize; i++) {
                this.$$dataSymbol.push([]);
            }
        };

        RSMM.prototype.$$handlerIdleInit = function (stateDurationTime) {
            this.$$averageNoiseLevelHistory.push(this.$$currentData.pilotSignal.powerDecibel);

            if (this.$$averageNoiseLevelHistory.length === _RxStateMachineManager.AVERAGE_NOISE_LEVEL_HISTORY_SIZE) {
                this.$$averageNoiseLevel = 0;
                for (var i = 0; i < this.$$averageNoiseLevelHistory.length; i++) {
                    this.$$averageNoiseLevel += this.$$averageNoiseLevelHistory[i];
                }
                this.$$averageNoiseLevel /= this.$$averageNoiseLevelHistory.length;

                this.$$powerThreshold = this.$$averageNoiseLevel + 20;

                return RxStateMachine.STATE.IDLE;
            }
        };

        RSMM.prototype.$$handlerSignalInit = function (stateDurationTime) {

        };

        RSMM.prototype.$$handlerIdle = function (stateDurationTime) {
            /*
            if (this.$$packetData.length > 0) {
                if (this.$$packetReceiveHandler) {
                    // TODO map psk: Math.round(pilotSignalCarrierDetail.phase * this.$$pskSize) % this.$$pskSize :
                    this.$$packetReceiveHandler(this.$$channelIndex, this.$$packetData);
                }
                this.$$packetData = [];
            }
            */

            /*
            if (this.$$waitingForSync) {
                this.$$averageNoiseLevel[0] = symbolData.powerDecibel;
            }
            */
        };

        RSMM.prototype.$$handlerSymbol = function (stateDurationTime) {
            // this.$$symbolData.push(symbolData);
        };

        RSMM.prototype.$$handlerSync = function (stateDurationTime) {

        };

        RSMM.prototype.$$handlerGuard = function (stateDurationTime) {
            var symbolWithBestQuality;

            /*
            if (this.$$symbolData.length > 0) {
                symbolWithBestQuality = getSymbolWithBestQuality(this.$$symbolData);
                this.$$packetData.push(symbolWithBestQuality.symbol);
                if (this.$$packetData.length === 1) {
                    handleFirstSymbolInPacket(symbolWithBestQuality);
                }
                this.$$symbolData = [];
            }
            */
        };

        RSMM.prototype.$$handlerError = function (stateDurationTime) {

        };

        // function handleFirstSymbolInPacket(symbolData) {
        //     var current;
        //
        //     if (syncPreamble) {
        //         current = anpl.getRxPhaseCorrection(0, 0);
        //         anpl.setRxPhaseCorrection(0, 0, current + symbolData.phase);
        //     }
        // }
        //
        // function getSymbolWithBestQuality(symbolDataList) {
        //     var symbol = 0, i, bestQualityIndex, maxPower;
        //
        //     if (symbolDataList.length === 0) {
        //         throw 'Something went wrong at symbol decision';
        //     }
        //
        //     maxPower = -100;
        //     for (i = 0; i < symbolDataList.length; i++) {
        //         if (symbolDataList[i].powerDecibel > maxPower) {
        //             bestQualityIndex = i;
        //             maxPower = symbolDataList[i].powerDecibel;
        //         }
        //     }
        //
        //     return symbolDataList[bestQualityIndex];
        // }

        RSMM.prototype.$$inputIsReallyConnected = function (powerDecibel) {
            return powerDecibel !== _RxStateMachineManager.NO_INPUT_POWER;
        };

        RSMM.prototype.receive = function (carrierDetail, time) {
            var pilotSignal, pilotSignalPresent, state = null;

            // grab current data, this will be available at all handlers that will be called back by $$stateMachine
            this.$$currentData = {
                pilotSignal: carrierDetail[_RxStateMachineManager.OFDM_PILOT_SIGNAL_INDEX],  // alias for pilot
                carrierDetail: carrierDetail
            };
            pilotSignal = this.$$currentData.pilotSignal;

            if (this.$$inputIsReallyConnected(pilotSignal.powerDecibel)) {
                // TODO add some kind of 'schmitt trigger' logic here to cleanup noise at signal transitions
                pilotSignalPresent = pilotSignal.powerDecibel > this.$$powerThreshold;
                state = this.$$stateMachine.getState(pilotSignalPresent, time);
            }

            return {
                state: state,
                power: Math.round(this.$$averageNoiseLevel) + ' ' + Math.round(this.$$averageSignalLevel)
            };
        };

        return RSMM;
    }

    return _RxStateMachineManager();        // TODO change it to dependency injection

})();
