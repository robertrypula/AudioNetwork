var RxStateMachineManager = (function () {
    'use strict';

    _RxStateMachineManager.$inject = [];

    _RxStateMachineManager.SYNC_STATE_MAX_DURATION_TIME = 8.0;
    _RxStateMachineManager.INITIAL_POWER_THRESHOLD = 0;
    _RxStateMachineManager.OFDM_PILOT_SIGNAL_INDEX = 0;
    _RxStateMachineManager.INITIAL_DIFFERENCE_BETWEEN_NOISE_AND_SIGNAL = 10;
    _RxStateMachineManager.INITIAL_DIFFERENCE_BETWEEN_SIGNAL_AND_THRESHOLD = 3;
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
                this.$$handlerFirstSyncWait.bind(this),
                this.$$handlerSignalInit.bind(this),
                this.$$handlerFatalError.bind(this),
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

            this.$$averageNoiseLevel = null;
            this.$$averageNoiseLevelHistory = [];
            this.$$averageGuardLevel = null;
            this.$$averageGuardLevelHistory = [];
            this.$$averageSignalLevel = null;
            this.$$averageSignalLevelHistory = [];
            this.$$powerThreshold = _RxStateMachineManager.INITIAL_POWER_THRESHOLD;

            this.$$powerMaxSignal = null;
            this.$$powerMinGuard = null;

            this.$$dataPacket = [];
            this.$$dataSymbol = [];
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

        RSMM.prototype.$$handlerIdleInit = function (stateDurationTime) {
            this.$$averageNoiseLevelHistory.push(this.$$currentData.pilotSignal.powerDecibel);
            if (this.$$averageNoiseLevelHistory.length === _RxStateMachineManager.AVERAGE_NOISE_LEVEL_HISTORY_SIZE) {
                this.$$averageNoiseLevel = AudioUtil.computeAverage(this.$$averageNoiseLevelHistory);
                this.$$powerThreshold = this.$$averageNoiseLevel + _RxStateMachineManager.INITIAL_DIFFERENCE_BETWEEN_NOISE_AND_SIGNAL;

                return RxStateMachine.STATE.FIRST_SYNC_WAIT;
            }
        };

        RSMM.prototype.$$handlerFirstSyncWait = function (stateDurationTime) {
            // nothing much here
        };

        RSMM.prototype.$$handlerSignalInit = function (stateDurationTime) {
            var pilotSignalPresent, powerDecibel = this.$$currentData.pilotSignal.powerDecibel;

            // signal cannot be weaker that noise... :)
            if (powerDecibel <= this.$$averageNoiseLevel) {
                return RxStateMachine.STATE.FATAL_ERROR;
            }

            pilotSignalPresent = powerDecibel > this.$$powerThreshold;
            if (this.$$averageSignalLevel !== null && !pilotSignalPresent) {
                return RxStateMachine.STATE.IDLE;
            }

            if (this.$$averageSignalLevelHistory.length !== _RxStateMachineManager.AVERAGE_SIGNAL_LEVEL_HISTORY_SIZE) {
                this.$$averageSignalLevelHistory.push(powerDecibel);
            } else {
                this.$$averageSignalLevel = AudioUtil.computeAverage(this.$$averageSignalLevelHistory);
                this.$$powerThreshold = this.$$averageSignalLevel - _RxStateMachineManager.INITIAL_DIFFERENCE_BETWEEN_SIGNAL_AND_THRESHOLD;
                this.$$averageSignalLevelHistory.length = 0;
            }
        };

        RSMM.prototype.$$handlerFatalError = function (stateDurationTime) {
            // nothing much here - manual state machine reset is a way to get out if this state
        };
        
        RSMM.prototype.$$handlerIdle = function (stateDurationTime) {
            var packetDataFinal;

            if (this.$$dataPacket.length > 0) {
                console.log('packet received', this.$$dataPacket);

                if (this.$$packetReceiveHandler) {
                    packetDataFinal = this.$$preparePacket(this.$$dataPacket);
                    this.$$packetReceiveHandler(this.$$channelIndex, packetDataFinal);
                }

                this.$$dataPacket = [];
            }
        };

        RSMM.prototype.$$handlerSymbol = function (stateDurationTime) {
            // update current min guard power
            if (this.$$averageGuardLevelHistory.length > 0) {
                this.$$powerMinGuard = MathUtil.min.apply(null, this.$$averageGuardLevelHistory);
                this.$$averageGuardLevelHistory.length = 0;
            }

            // store signal power history
            this.$$averageSignalLevelHistory.push(
                this.$$currentData.pilotSignal.powerDecibel
            );

            // add current signal sample to list
            this.$$dataSymbol.push(this.$$currentData);
        };

        RSMM.prototype.$$handlerSync = function (stateDurationTime) {

        };

        RSMM.prototype.$$handlerGuard = function (stateDurationTime) {
            var bestQualityIndex;

            // update current max signal power
            if (this.$$averageSignalLevelHistory.length > 0) {
                this.$$powerMaxSignal = MathUtil.max.apply(null, this.$$averageSignalLevelHistory);
                this.$$averageSignalLevelHistory.length = 0;
            }

            // store guard power history
            this.$$averageGuardLevelHistory.push(
                this.$$currentData.pilotSignal.powerDecibel
            );

            // find best signal sample and add to current packet
            if (this.$$dataSymbol.length > 0) {
                bestQualityIndex = AudioUtil.findMaxValueIndex(this.$$dataSymbol, 'pilotSignal.powerDecibel');
                this.$$dataPacket.push(
                    this.$$dataSymbol[bestQualityIndex].carrierDetail
                );
                if (this.$$isPacketSyncPreamble()) {
                    this.$$handlePacketSyncPreamble(
                        this.$$dataSymbol[bestQualityIndex].carrierDetail
                    );
                }
                this.$$dataSymbol = [];
            }
        };

        RSMM.prototype.$$handlerError = function (stateDurationTime) {
            // nothing much here - this state will automatically transit to idle when pilot signal will be gone
        };

        RSMM.prototype.$$handlePacketSyncPreamble = function (carrierDetail) {
            var current, i;

            // TODO notify about phase correction
            for (i = 0; i < carrierDetail.length; i++) {
                current = anpl.getRxPhaseCorrection(this.$$channelIndex, i);
                anpl.setRxPhaseCorrection(this.$$channelIndex, i, current + carrierDetail[i].phase);
                console.log('Phase corrected for channel ' + this.$$channelIndex + ' at ofdm ' + i + ': ' + (current + carrierDetail[i].phase));
            }
        };

        RSMM.prototype.$$preparePacket = function (dataPacket) {
            var i, j, result, ofdmList, carrierDetail;

            result = [];
            for (i = 0; i < dataPacket.length; i++) {
                carrierDetail = dataPacket[i];
                ofdmList = [];
                for (j = 0; j < carrierDetail.length; j++) {
                    ofdmList.push(
                        Math.round(carrierDetail[j].phase * this.$$pskSize) % this.$$pskSize
                    );
                    
                }
                result.push(ofdmList);
            }

            return result;
        };

        RSMM.prototype.$$isPacketSyncPreamble = function () {
            return this.$$syncPreamble && this.$$dataPacket.length === 1;
        };

        RSMM.prototype.$$isInputReallyConnected = function (powerDecibel) {
            return (
                (
                    this.$$averageNoiseLevel !== null &&
                    this.$$averageSignalLevel !== null
                ) || (
                    powerDecibel !== _RxStateMachineManager.NO_INPUT_POWER
                )
            );
        };

        RSMM.prototype.receive = function (carrierDetail, time) {
            var pilotSignal, pilotSignalPresent, state = null;

            // grab current data, this will be available at all handlers that will be called back by $$stateMachine
            this.$$currentData = {
                pilotSignal: carrierDetail[_RxStateMachineManager.OFDM_PILOT_SIGNAL_INDEX],  // alias for pilot
                carrierDetail: carrierDetail
            };
            pilotSignal = this.$$currentData.pilotSignal;

            if (this.$$isInputReallyConnected(pilotSignal.powerDecibel)) {
                // TODO add some kind of 'schmitt trigger' logic here to cleanup noise at signal transitions
                pilotSignalPresent = pilotSignal.powerDecibel > this.$$powerThreshold;
                state = this.$$stateMachine.getState(pilotSignalPresent, time);
            }

            return {
                state: state,
                power: (
                    Math.round(this.$$averageNoiseLevel) + ' ' + Math.round(this.$$averageSignalLevel) + ' <br/> ' +
                    this.$$dataSymbol.length + ', ' + this.$$dataPacket.length + '<br/>' +
                    'realtime: ' + this.$$powerMinGuard + ', ' + this.$$powerMaxSignal
                )
            };
        };

        return RSMM;
    }

    return _RxStateMachineManager();        // TODO change it to dependency injection

})();
