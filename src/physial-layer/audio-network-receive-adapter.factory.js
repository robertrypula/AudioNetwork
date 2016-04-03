var AudioNetworkReceiveAdapter = (function () {
    'use strict';

    _AudioNetworkReceiveAdapter.$inject = [];

    _AudioNetworkReceiveAdapter.GUARD_STATE_MAX_DURATION_TIME = 1.0;
    _AudioNetworkReceiveAdapter.SYMBOL_STATE_MAX_DURATION_TIME = 1.0;
    _AudioNetworkReceiveAdapter.SYNC_STATE_MAX_DURATION_TIME = 8.0;
    _AudioNetworkReceiveAdapter.POWER_THRESHOLD = 0;

    function _AudioNetworkReceiveAdapter() {
        var ANRA;

        ANRA = function (audioNetworkPhysicalLayer) {
            var _anra = _AudioNetworkReceiveAdapter;

            this.$$audioNetworkPhysicalLayer = audioNetworkPhysicalLayer;
            this.$$stateMachine = RxStateMachineBuilder.build(
                this.$$handlerIdle.bind(this),
                this.$$handlerSymbol.bind(this),
                this.$$handlerSync.bind(this),
                this.$$handlerGuard.bind(this),
                this.$$handlerError.bind(this)
            );
            this.$$stateMachine.setGuardStateMaxDurationTime(_anra.GUARD_STATE_MAX_DURATION_TIME);
            this.$$stateMachine.setSymbolStateMaxDurationTime(_anra.SYMBOL_STATE_MAX_DURATION_TIME);
            this.$$stateMachine.setSyncStateMaxDurationTime(_anra.SYNC_STATE_MAX_DURATION_TIME);

            this.$$powerThreshold = _anra.POWER_THRESHOLD;
            this.$$symbolData = [];
            this.$$packetData = [];
        };

        ANRA.prototype.$$handlerIdle = function (time, symbolData) {
            if (this.$$packetData.length > 0) {
                // --> trigger new packet event
                this.$$packetData = [];
            }
        };

        ANRA.prototype.$$handlerSymbol = function (time, symbolData) {
            this.$$symbolData.push(symbolData);
        };

        ANRA.prototype.$$handlerSync = function (time, symbolData) {

        };

        ANRA.prototype.$$handlerGuard = function (time, symbolData) {
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

        ANRA.prototype.$$handlerError = function (time, symbolData) {

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

            state = this.$$stateMachine.getState(testSymbolData, time);

            return {
                state: state + ' - ' + testSymbolData.symbol
            };
        };

        return ANRA;
    }

    return _AudioNetworkReceiveAdapter();        // TODO change it to dependency injection

})();
