// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayerAdapter.RxStateMachineManager', _RxStateMachineManager);

    _RxStateMachineManager.$inject = [
        'Common.MathUtil',
        'Common.Util',
        'Common.AverageValueCollectorBuilder',
        'PhysicalLayer.DefaultConfig',
        'PhysicalLayerAdapter.SignalPowerCollectorBuilder',
        'PhysicalLayerAdapter.GuardPowerCollectorBuilder',
        'PhysicalLayerAdapter.PhaseOffsetCollectorBuilder',
        'PhysicalLayerAdapter.RxStateMachineBuilder',
        'PhysicalLayerAdapter.ReceiveAdapterState'
    ];

    function _RxStateMachineManager(
        MathUtil,
        Util,
        AverageValueCollectorBuilder,
        DefaultConfig,
        SignalPowerCollectorBuilder,
        GuardPowerCollectorBuilder,
        PhaseOffsetCollectorBuilder,
        RxStateMachineBuilder,
        ReceiveAdapterState
    ) {
        var RxStateMachineManager;

        RxStateMachineManager = function (channelIndex, packetReceiveHandler, frequencyUpdateHandler, phaseCorrectionUpdateHandler) {
            this.$$channelIndex = channelIndex;

            this.$$packetReceiveHandler = packetReceiveHandler;
            this.$$frequencyUpdateHandler = frequencyUpdateHandler;
            this.$$phaseCorrectionUpdateHandler = phaseCorrectionUpdateHandler;

            this.$$stateMachine = RxStateMachineBuilder.build(
                this.$$handlerIdleInit.bind(this),
                this.$$handlerFirstSyncWait.bind(this),
                this.$$handlerFirstSync.bind(this),
                this.$$handlerFatalError.bind(this),
                this.$$handlerIdle.bind(this),
                this.$$handlerSymbol.bind(this),
                this.$$handlerSync.bind(this),
                this.$$handlerGuard.bind(this),
                this.$$handlerError.bind(this)
            );

            this.$$sampleCollectionTimeIdleInitState = null;
            this.$$sampleCollectionTimeFirstSyncState = null;
            this.$$syncPreamble = null;
            this.$$pskSize = null;

            this.$$averageIdlePowerCollector = AverageValueCollectorBuilder.build();
            this.$$averageFirstSyncPowerCollector = AverageValueCollectorBuilder.build();
            this.$$signalPowerCollector = SignalPowerCollectorBuilder.build();
            this.$$guardPowerCollector = GuardPowerCollectorBuilder.build();
            this.$$phaseOffsetCollector = PhaseOffsetCollectorBuilder.build();

            this.$$resetInternal();
        };

        RxStateMachineManager.$$_INITIAL_POWER_THRESHOLD = 0;      // after init we need to listen to noise so this threshold should prevent catching all possible signals
        RxStateMachineManager.$$_DECIBLES_ABOVE_AVERAGE_IDLE = 10; // decibels above average idle power (ambient noise) in order to catch first, even weak, signal - it means that you should keep this value low
        RxStateMachineManager.$$_OFDM_PILOT_SIGNAL_INDEX = 0;
        RxStateMachineManager.$$_AVERAGE_POWER_UNIT_FACTOR = 0.5;  // 0.0 -> closer to average 'idle' power, 1.0 -> closer to average 'first sync' power

        RxStateMachineManager.prototype.$$resetInternal = function () {
            this.$$averageIdlePowerCollector.clearAll();
            this.$$averageFirstSyncPowerCollector.clearAll();
            this.$$signalPowerCollector.clearAll();
            this.$$guardPowerCollector.clearAll();
            this.$$phaseOffsetCollector.clearAll();

            this.$$powerThreshold = RxStateMachineManager.$$_INITIAL_POWER_THRESHOLD;

            this.$$currentData = null;
            this.$$dataPacket = [];
            this.$$dataSymbol = [];
        };

        RxStateMachineManager.prototype.reset = function () {
            this.$$resetInternal();
            this.$$stateMachine.scheduleReset();
        };

        RxStateMachineManager.prototype.setSymbolStateMaxDurationTime = function (value) {
            this.$$stateMachine.setSymbolStateMaxDurationTime(value);
        };

        RxStateMachineManager.prototype.setGuardStateMaxDurationTime  = function (value) {
            this.$$stateMachine.setGuardStateMaxDurationTime(value);
        };

        RxStateMachineManager.prototype.setSyncStateMaxDurationTime = function (value) {
            this.$$stateMachine.setSyncStateMaxDurationTime(value);
        };

        RxStateMachineManager.prototype.setSampleCollectionTimeIdleInitState = function (value) {
            this.$$sampleCollectionTimeIdleInitState = value;
        };

        RxStateMachineManager.prototype.setSampleCollectionTimeFirstSyncState = function (value) {
            this.$$sampleCollectionTimeFirstSyncState = value;
        };

        RxStateMachineManager.prototype.setSyncPreamble  = function (value) {
            this.$$syncPreamble = value;
        };

        RxStateMachineManager.prototype.setPskSize  = function (value) {
            this.$$pskSize = value;
        };

        RxStateMachineManager.prototype.$$handlerIdleInit = function (stateDurationTime) {
            var
                powerDecibel = this.$$currentData.pilotSignal.powerDecibel,
                handlerResult = null
            ;

            if (stateDurationTime < this.$$sampleCollectionTimeIdleInitState) {
                this.$$averageIdlePowerCollector.collect(powerDecibel);
            } else {
                try {
                    // put first power threshold slightly above collected noise power to detect even weak signals
                    this.$$powerThreshold = this.$$averageIdlePowerCollector.finalize() + RxStateMachineManager.$$_DECIBLES_ABOVE_AVERAGE_IDLE;
                    handlerResult = ReceiveAdapterState.FIRST_SYNC_WAIT;
                } catch (e) {
                    handlerResult = ReceiveAdapterState.FATAL_ERROR;
                }
            }

            return handlerResult;
        };

        RxStateMachineManager.prototype.$$handlerFirstSyncWait = function (stateDurationTime) {
            // nothing much here - user needs to send 'Sync' signal on the other device, we can just wait...
            return null;
        };

        RxStateMachineManager.prototype.$$handlerFirstSync = function (stateDurationTime) {
            var 
                powerDecibel = this.$$currentData.pilotSignal.powerDecibel,
                averageFirstSyncPower, averageIdlePower, powerDifference
            ;

            // TODO refactor code block order - condition below happens actually at FIRST_SYNC state end
            if (this.$$averageFirstSyncPowerCollector.getLastFinalizedResult()) {
                // wait until signal will drop below threshold
                if (powerDecibel < this.$$powerThreshold) {
                    return ReceiveAdapterState.IDLE;
                } else {
                    return null;
                }
            }

            // signal cannot be weaker than previously stored average idle noise... :)
            if (powerDecibel <= this.$$averageIdlePowerCollector.getLastFinalizedResult()) {
                return ReceiveAdapterState.FATAL_ERROR;
            }
            
            if (stateDurationTime < this.$$sampleCollectionTimeFirstSyncState) {
                // collect phase history for all OFDM subcarriers - it will be later used for fine-tune frequency offsets
                this.$$phaseOffsetCollector.collect({
                    stateDurationTime: stateDurationTime,
                    carrierDetail: this.$$currentData.carrierDetail
                });

                // collect desired signal power history and later compute average signal power and power threshold
                this.$$averageFirstSyncPowerCollector.collect(powerDecibel);
            } else {
                try {
                    averageFirstSyncPower = this.$$averageFirstSyncPowerCollector.finalize();    // this line may trow error
                    averageIdlePower = this.$$averageIdlePowerCollector.getLastFinalizedResult();
                    powerDifference = averageFirstSyncPower - averageIdlePower;

                    // put threshold somewhere (depending on unit factor) between average idle power and average first sync power
                    this.$$powerThreshold = averageIdlePower + RxStateMachineManager.$$_AVERAGE_POWER_UNIT_FACTOR * powerDifference;
                } catch (e) {
                    return ReceiveAdapterState.FATAL_ERROR;
                }
            }
        };

        RxStateMachineManager.prototype.$$handlerFatalError = function (stateDurationTime) {
            // nothing much here - only way to escape from this state is to reset Receive Adapter
        };
        
        RxStateMachineManager.prototype.$$handlerIdle = function (stateDurationTime) {
            // share collected packet with rest of the world
            if (this.$$dataPacket.length > 0) {
                this.$$packetReceiveHandler(this.$$channelIndex, this.$$preparePacket(this.$$dataPacket));
                this.$$dataPacket.length = 0;
            }

            // fine-tune frequency offsets basing on phase history if any
            if (this.$$phaseOffsetCollector.hasAtLeastItem()) {
                this.$$frequencyUpdateHandler(this.$$channelIndex, this.$$phaseOffsetCollector.finalize());
            }

            // clear collected guard history from last 'GUARD' state because it was followed
            // directly by IDLE state so technically it wasn't GUARD state at all
            this.$$guardPowerCollector.clearList();
        };

        RxStateMachineManager.prototype.$$handlerSymbol = function (stateDurationTime) {
            var powerDecibel = this.$$currentData.pilotSignal.powerDecibel;

            // code below stores information about quality of incoming packets in the real time
            this.$$signalPowerCollector.collect(powerDecibel);
            if (this.$$guardPowerCollector.hasAtLeastItem()) {
                this.$$guardPowerCollector.finalize();
            }
        
            // add current signal sample to list
            this.$$dataSymbol.push(this.$$currentData);
        };

        RxStateMachineManager.prototype.$$handlerSync = function (stateDurationTime) {
            // collect phase history for all OFDM subcarriers - it will be later used for fine-tune frequency offsets
            this.$$phaseOffsetCollector.collect({
                stateDurationTime: stateDurationTime,
                carrierDetail: this.$$currentData.carrierDetail
            });
        };

        RxStateMachineManager.prototype.$$handlerGuard = function (stateDurationTime) {
            var
                powerDecibel = this.$$currentData.pilotSignal.powerDecibel,
                bestQualityIndex
            ;

            // code below stores information about quality of incoming packets in the real time
            this.$$guardPowerCollector.collect(powerDecibel);
            if (this.$$signalPowerCollector.hasAtLeastItem()) {
                this.$$signalPowerCollector.finalize();
            }

            // find best signal sample and add to current packet
            if (this.$$dataSymbol.length > 0) {
                bestQualityIndex = Util.findMaxValueIndex(this.$$dataSymbol, 'pilotSignal.powerDecibel');
                this.$$dataPacket.push(
                    this.$$dataSymbol[bestQualityIndex].carrierDetail
                );
                if (this.$$isCurrentSymbolSyncPreamble()) {
                    this.$$phaseCorrectionUpdateHandler(this.$$channelIndex, this.$$dataSymbol[bestQualityIndex].carrierDetail);
                }
                this.$$dataSymbol = [];
            }
        };

        RxStateMachineManager.prototype.$$handlerError = function (stateDurationTime) {
            // nothing much here - this state will automatically transit to idle when pilot signal will be gone
        };

        RxStateMachineManager.prototype.$$preparePacket = function (dataPacket) {
            var i, j, result, ofdmList, carrierDetail;

            result = [];
            for (i = 0; i < dataPacket.length; i++) {
                if (i === 0 && this.$$syncPreamble) {
                    // when syncPreamble is true then first burst is used only for phase
                    // alignment - we can simply omit it in the final packet
                    continue;
                }
                carrierDetail = dataPacket[i];
                ofdmList = [];
                for (j = 0; j < carrierDetail.length; j++) {
                    ofdmList.push(
                        MathUtil.round(carrierDetail[j].phase * this.$$pskSize) % this.$$pskSize
                    );
                }
                result.push(ofdmList);
            }

            return result;
        };

        RxStateMachineManager.prototype.$$isCurrentSymbolSyncPreamble = function () {
            return this.$$syncPreamble && this.$$dataPacket.length === 1;
        };

        RxStateMachineManager.prototype.$$isInputReallyConnected = function () {
            return this.$$currentData.pilotSignal.powerDecibel !== DefaultConfig.MINIMUM_POWER_DECIBEL;
        };

        RxStateMachineManager.prototype.$$isPilotSignalPresent = function () {
            return this.$$currentData.pilotSignal.powerDecibel > this.$$powerThreshold;
        };

        RxStateMachineManager.prototype.receive = function (carrierDetail, time) {
            var state;

            // grab current data, this will be available at all handlers that will be called back by $$stateMachine
            this.$$currentData = {
                pilotSignal: carrierDetail[RxStateMachineManager.$$_OFDM_PILOT_SIGNAL_INDEX],  // alias for pilot
                carrierDetail: carrierDetail
            };

            if (this.$$isInputReallyConnected()) {
                state = this.$$stateMachine.getState(this.$$isPilotSignalPresent(), time);
            } else {
                state = ReceiveAdapterState.NO_INPUT;
                this.reset();
            }

            return {
                state: state,
                // TODO clean that mess below, move data to some dedicated fields in return object
                power: (
                    '<br/>' +
                    'averageIdlePower: ' + MathUtil.round(this.$$averageIdlePowerCollector.getLastFinalizedResult() * 100) / 100 + '<br/>' +
                    'averageFirstSyncPower: ' + MathUtil.round(this.$$averageFirstSyncPowerCollector.getLastFinalizedResult() * 100) / 100 + ' <br/>' +
                    '&nbsp;&nbsp;&nbsp;delta: ' + MathUtil.round((this.$$averageFirstSyncPowerCollector.getLastFinalizedResult() - this.$$averageIdlePowerCollector.getLastFinalizedResult()) * 100) / 100 + ' <br/>' +
                    '&nbsp;&nbsp;&nbsp;powerThreshold: ' + MathUtil.round(this.$$powerThreshold * 100) / 100 + ' <br/>' +
                    'minGuardPower: ' + MathUtil.round(this.$$guardPowerCollector.getLastFinalizedResult() * 100) / 100 + ' sampleSize: ' + this.$$guardPowerCollector.getLastFinalizedSize() + '<br/>' +
                    'maxSignalPower: ' + MathUtil.round(this.$$signalPowerCollector.getLastFinalizedResult() * 100) / 100 + ' sampleSize: ' + this.$$signalPowerCollector.getLastFinalizedSize() + '<br/>' +
                    '&nbsp;&nbsp;&nbsp;delta: ' + MathUtil.round((this.$$signalPowerCollector.getLastFinalizedResult() - this.$$guardPowerCollector.getLastFinalizedResult()) * 100) / 100 + ' <br/>' +
                    '&nbsp;&nbsp;&nbsp;idealPowerThreshold: ' + MathUtil.round(0.5 * (this.$$signalPowerCollector.getLastFinalizedResult() + this.$$guardPowerCollector.getLastFinalizedResult()) * 100) / 100 + ' <br/>'
                )
            };
        };

        return RxStateMachineManager;
    }

})();
