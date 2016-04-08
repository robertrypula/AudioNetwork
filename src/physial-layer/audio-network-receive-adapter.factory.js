var AudioNetworkReceiveAdapter = (function () {
    'use strict';

    _AudioNetworkReceiveAdapter.$inject = [];

    _AudioNetworkReceiveAdapter.SYMBOL_DURATION = 0.25;
    _AudioNetworkReceiveAdapter.GUARD_INTERVAL = 0.25;
    _AudioNetworkReceiveAdapter.SYNC_PREAMBLE = true;
    _AudioNetworkReceiveAdapter.PSK_SIZE = 4;
    _AudioNetworkReceiveAdapter.TIME_TOLERANCE_PERCENT = 10;               // how much state times could be longer
    _AudioNetworkReceiveAdapter.ALL_CHANNEL_PSK_SIZE = null;

    function _AudioNetworkReceiveAdapter() {
        var ANRA;

        ANRA = function (audioNetworkPhysicalLayer) {
            var channelIndex, channelSize, stateMachineManager;

            this.$$audioNetworkPhysicalLayer = audioNetworkPhysicalLayer;
            this.$$stateMachineManager = [];
            this.$$packetReceiveHandler = null;
            
            channelSize = this.$$audioNetworkPhysicalLayer.getRxChannelSize();
            for (channelIndex = 0; channelIndex < channelSize; channelIndex++) {
                stateMachineManager = RxStateMachineManagerBuilder.build(
                    channelIndex,
                    this.$$audioNetworkPhysicalLayer,
                    this.$$packetReceiveInternalHandler.bind(this)
                );
                this.$$stateMachineManager.push(stateMachineManager);
            }
            this.setSymbolDuration(_AudioNetworkReceiveAdapter.SYMBOL_DURATION);
            this.setGuardInterval(_AudioNetworkReceiveAdapter.GUARD_INTERVAL);
            this.setSyncPreamble(_AudioNetworkReceiveAdapter.SYNC_PREAMBLE);
            this.setPskSize(_AudioNetworkReceiveAdapter.ALL_CHANNEL_PSK_SIZE, _AudioNetworkReceiveAdapter.PSK_SIZE);
        };

        ANRA.prototype.setSymbolDuration = function (value) {
            var channelSize, i;

            channelSize = this.$$audioNetworkPhysicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSymbolStateMaxDurationTime(
                    value * (1.0 + _AudioNetworkReceiveAdapter.TIME_TOLERANCE_PERCENT / 100)
                );
            }
        };

        ANRA.prototype.setGuardInterval = function (value) {
            var channelSize, i;

            channelSize = this.$$audioNetworkPhysicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setGuardStateMaxDurationTime(
                    value * (1.0 + _AudioNetworkReceiveAdapter.TIME_TOLERANCE_PERCENT / 100)
                );
            }
        };

        ANRA.prototype.setSyncPreamble = function (value) {
            var channelSize, i;

            value = !!value;
            channelSize = this.$$audioNetworkPhysicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSyncPreamble(value);
            }
        };

        ANRA.prototype.setPskSize = function (channelIndex, value) {
            var channelSize, i;

            if (channelIndex === _AudioNetworkReceiveAdapter.ALL_CHANNEL_PSK_SIZE) {
                channelSize = this.$$audioNetworkPhysicalLayer.getRxChannelSize();
                for (i = 0; i < channelSize; i++) {
                    this.$$stateMachineManager[i].setPskSize(value);
                }
            } else {
                this.$$checkChannelIndexRange(channelIndex);
                this.$$stateMachineManager[channelIndex].setPskSize(value);
            }
        };

        ANRA.prototype.$$packetReceiveInternalHandler = function (channelIndex, data) {

            // TODO here we can translate ofdm-1 array into one number

            if (this.$$packetReceiveHandler) {
                this.$$packetReceiveHandler(channelIndex, data);
            }
        };

        ANRA.prototype.$$checkChannelIndexRange = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.$$audioNetworkPhysicalLayer.getRxChannelSize()) {
                throw 'Given channelIndex is outside range: ' + channelIndex;
            }
        };

        ANRA.prototype.setPacketReceiveHandler = function (cb) {
            if (typeof cb === 'function') {
                this.$$packetReceiveHandler = cb;
            } else {
                this.$$packetReceiveHandler = null;
            }
        };

        ANRA.prototype.receive = function (channelIndex, carrierDetail, time) {
            var state;

            this.$$checkChannelIndexRange(channelIndex);

            state = this.$$stateMachineManager[channelIndex].getState(carrierDetail, time);

            return {
                state: state
            };
        };

        return ANRA;
    }

    return _AudioNetworkReceiveAdapter();        // TODO change it to dependency injection

})();
