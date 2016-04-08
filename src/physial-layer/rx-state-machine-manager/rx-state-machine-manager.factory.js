var RxStateMachineManager = (function () {
    'use strict';

    _RxStateMachineManager.$inject = [];

    _RxStateMachineManager.SYNC_STATE_MAX_DURATION_TIME = 8.0;
    _RxStateMachineManager.INITIAL_NOISE_LEVEL = -100;
    _RxStateMachineManager.INITIAL_SIGNAL_LEVEL = 0;

    function _RxStateMachineManager() {
        var RSMM;

        RSMM = function (channelIndex, audioNetworkPhysicalLayer) {
            this.$$channelIndex = channelIndex;
            this.$$audioNetworkPhysicalLayer = audioNetworkPhysicalLayer;
            this.$$stateMachine = RxStateMachineBuilder.build(
                this.$$handlerIdle.bind(this),
                this.$$handlerSymbol.bind(this),
                this.$$handlerSync.bind(this),
                this.$$handlerGuard.bind(this),
                this.$$handlerError.bind(this)
            );

            this.$$syncPreamble = null;
            this.$$pskSize = null;
            this.$$waitingForSync = true;
            this.$$averageNoiseLevel = _RxStateMachineManager.INITIAL_NOISE_LEVEL;
            this.$$averageSignalLevel = _RxStateMachineManager.INITIAL_SIGNAL_LEVEL;

            /*
            this.$$packetData = [];
            this.$$symbolData = [];
            this.$$powerThreshold = _anra.POWER_THRESHOLD;         // TODO to delete later
            */
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

        RSMM.prototype.$$handlerIdle = function (time, symbolData) {
            /*
            if (this.$$packetData.length > 0) {
                if (this.$$packetReceiveHandler) {
                    this.$$packetReceiveHandler(0, this.$$packetData);     // TODO change hardcoded channelIndex
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

        RSMM.prototype.$$handlerSymbol = function (time, symbolData) {
            // this.$$symbolData.push(symbolData);
        };

        RSMM.prototype.$$handlerSync = function (time, symbolData) {

        };

        RSMM.prototype.$$handlerGuard = function (time, symbolData) {
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

        RSMM.prototype.$$handlerError = function (time, symbolData) {

        };

        // function handleFirstSymbolInPacket(symbolData) {
        //     var
        //         syncPreamble = !!document.getElementById('sync-preamble').checked,
        //         current
        //         ;
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

        RSMM.prototype.$$initializeStorage = function () {
            /*
            var 
                channelSize = this.$$audioNetworkPhysicalLayer.getRxChannelSize(),
                ofdmSize,
                i, j
            ;
            this.$$packetData.length = 0;
            this.$$symbolData.length = 0;
            
            for (i = 0; i < channelSize; i++) {
                this.$$packetData.push([]);

                ofdmSize = this.$$audioNetworkPhysicalLayer.getRxChannelOfdmSize(i),
                this.$$symbolData.push([]);
                for (j = 0; j < ofdmSize; j++) {
                    this.$$symbolData[i].push([]);
                }
            }
            */
        };

        RSMM.prototype.getState = function (carrierDetail, time) {
            return '---';
            /*
            var testSymbolData;

            testSymbolData = {
                symbol: (
                    carrierDetail[0].powerDecibel > this.$$powerThreshold ?
                    Math.round(carrierDetail[0].phase * this.$$pskSize) % this.$$pskSize :
                    null
                ),
                phase: carrierDetail[0].phase,
                powerDecibel: carrierDetail[0].powerDecibel
            };

            return this.$$stateMachine.getState(testSymbolData, time);
            */
        };

        return RSMM;
    }

    return _RxStateMachineManager();        // TODO change it to dependency injection

})();
