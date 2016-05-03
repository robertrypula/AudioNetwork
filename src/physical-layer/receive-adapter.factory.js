var AudioNetworkReceiveAdapter = (function () {
    'use strict';

    _AudioNetworkReceiveAdapter.$inject = [];

    _AudioNetworkReceiveAdapter.SYMBOL_DURATION = 0.080;     // TODO move to some common config
    _AudioNetworkReceiveAdapter.GUARD_INTERVAL = 0.170;      // TODO move to some common config
    _AudioNetworkReceiveAdapter.SYNC_DURATION = 3.0;         // TODO move to some common config
    _AudioNetworkReceiveAdapter.SAMPLE_COLLECTION_TIME_IDLE_INIT_STATE = _AudioNetworkReceiveAdapter.SYNC_DURATION;
    _AudioNetworkReceiveAdapter.SAMPLE_COLLECTION_TIME_FIRST_SYNC_STATE = _AudioNetworkReceiveAdapter.SYNC_DURATION * 0.85; // little less than 'Sync Duration' in order to finish signal collection before sync transmission ends
    _AudioNetworkReceiveAdapter.SYNC_PREAMBLE = true;
    _AudioNetworkReceiveAdapter.PSK_SIZE = 4;                // TODO move to some common config
    _AudioNetworkReceiveAdapter.TIME_TOLERANCE_FACTOR = 2.5; // how much state times could be longer - WARNING do not exceed interpacket gap (guardInterval * factor < interpacketGap)!
    _AudioNetworkReceiveAdapter.ALL_CHANNEL_PSK_SIZE = null;

    function _AudioNetworkReceiveAdapter() {
        var ANRA;

        ANRA = function (physicalLayer) {
            var channelIndex, channelSize, stateMachineManager;

            this.$$physicalLayer = physicalLayer;
            this.$$stateMachineManager = [];
            this.$$packetReceiveHandler = null;
            this.$$frequencyUpdateHandler = null;
            this.$$phaseCorrectionUpdateHandler = null;
            
            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (channelIndex = 0; channelIndex < channelSize; channelIndex++) {
                stateMachineManager = RxStateMachineManagerBuilder.build(
                    channelIndex,
                    this.$$packetReceiveInternalHandler.bind(this),
                    this.$$frequencyUpdateInternalHandler.bind(this),
                    this.$$phaseCorrectionUpdateInternalHandler.bind(this)
                );
                this.$$stateMachineManager.push(stateMachineManager);
            }
            this.setSymbolDuration(_AudioNetworkReceiveAdapter.SYMBOL_DURATION);
            this.setGuardInterval(_AudioNetworkReceiveAdapter.GUARD_INTERVAL);
            this.setSyncDuration(_AudioNetworkReceiveAdapter.SYNC_DURATION);
            this.setSampleCollectionTimeIdleInitState(_AudioNetworkReceiveAdapter.SAMPLE_COLLECTION_TIME_IDLE_INIT_STATE);
            this.setSampleCollectionTimeFirstSyncState(_AudioNetworkReceiveAdapter.SAMPLE_COLLECTION_TIME_FIRST_SYNC_STATE);
            this.setSyncPreamble(_AudioNetworkReceiveAdapter.SYNC_PREAMBLE);
            this.setPskSize(_AudioNetworkReceiveAdapter.ALL_CHANNEL_PSK_SIZE, _AudioNetworkReceiveAdapter.PSK_SIZE);
        };

        ANRA.prototype.reset = function (channelIndex) {
            this.$$checkChannelIndexRange(channelIndex);
            return this.$$stateMachineManager[channelIndex].reset();
        };

        ANRA.prototype.setSymbolDuration = function (value) {
            var channelSize, i;

            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSymbolStateMaxDurationTime(
                    value * _AudioNetworkReceiveAdapter.TIME_TOLERANCE_FACTOR
                );
            }
        };

        ANRA.prototype.setGuardInterval = function (value) {
            var channelSize, i;

            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setGuardStateMaxDurationTime(
                    value * _AudioNetworkReceiveAdapter.TIME_TOLERANCE_FACTOR
                );
            }
        };

        ANRA.prototype.setSyncDuration = function (value) {
            var channelSize, i;

            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSyncStateMaxDurationTime(
                    value * _AudioNetworkReceiveAdapter.TIME_TOLERANCE_FACTOR
                );
            }
        };

        ANRA.prototype.setSampleCollectionTimeIdleInitState = function (value) {
            var channelSize, i;

            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSampleCollectionTimeIdleInitState(value);
            }
        };

        ANRA.prototype.setSampleCollectionTimeFirstSyncState = function (value) {
            var channelSize, i;

            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSampleCollectionTimeFirstSyncState(value);
            }
        };

        ANRA.prototype.setSyncPreamble = function (value) {
            var channelSize, i;

            value = !!value;
            channelSize = this.$$physicalLayer.getRxChannelSize();
            for (i = 0; i < channelSize; i++) {
                this.$$stateMachineManager[i].setSyncPreamble(value);
            }
        };

        ANRA.prototype.setPskSize = function (channelIndex, value) {
            var channelSize, i;

            if (channelIndex === _AudioNetworkReceiveAdapter.ALL_CHANNEL_PSK_SIZE) {
                channelSize = this.$$physicalLayer.getRxChannelSize();
                for (i = 0; i < channelSize; i++) {
                    this.$$stateMachineManager[i].setPskSize(value);
                }
            } else {
                this.$$checkChannelIndexRange(channelIndex);
                this.$$stateMachineManager[channelIndex].setPskSize(value);
            }
        };

        ANRA.prototype.$$packetReceiveInternalHandler = function (channelIndex, data) {
            var i;

            for (i = 0; i < data.length; i++) {
                if (data[i].length === 1) {
                    data[i] = data[i][0];      // flatten data structure when only one ofdm is used for this channel
                }
            }

            if (this.$$packetReceiveHandler) {
                this.$$packetReceiveHandler(channelIndex, data);
            }
        };

        ANRA.prototype.$$frequencyUpdateInternalHandler = function (channelIndex, drift) {
            var current;

            if (drift === null) {
                return;
            }

            // TODO pass drift as array
            if (MathUtil.abs(drift) > 0.005) {
                current = this.$$physicalLayer.getRxFrequency(channelIndex, 0);
                console.log('phase history current', current);
                this.$$physicalLayer.setRxFrequency(channelIndex, 0, current + drift);
                console.log('Frequency corrected for channel ' + channelIndex + ' at ofdm ' + 0 + ': ' + (current + drift));
            }
            if (this.$$frequencyUpdateHandler) {
                this.$$frequencyUpdateHandler(channelIndex, drift);
            }  
        };

        ANRA.prototype.$$phaseCorrectionUpdateInternalHandler = function (channelIndex, carrierDetail) {
            var current, i;

            // TODO pass only phase array not full carrierDetail object
            for (i = 0; i < carrierDetail.length; i++) {
                current = this.$$physicalLayer.getRxPhaseCorrection(channelIndex, i);
                this.$$physicalLayer.setRxPhaseCorrection(channelIndex, i, current + carrierDetail[i].phase);
                console.log('Phase corrected for channel ' + channelIndex + ' at ofdm ' + i + ': ' + (current + carrierDetail[i].phase));
            }

            if (this.$$phaseCorrectionUpdateHandler) {
                this.$$phaseCorrectionUpdateHandler(channelIndex, carrierDetail);
            }
        };
        
        ANRA.prototype.$$checkChannelIndexRange = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.$$physicalLayer.getRxChannelSize()) {
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

        ANRA.prototype.setFrequencyUpdateHandler = function (cb) {
            if (typeof cb === 'function') {
                this.$$frequencyUpdateHandler = cb;
            } else {
                this.$$frequencyUpdateHandler = null;
            }
        };

        ANRA.prototype.setPhaseCorrectionUpdateHandler = function (cb) {
            if (typeof cb === 'function') {
                this.$$phaseCorrectionUpdateHandler = cb;
            } else {
                this.$$phaseCorrectionUpdateHandler = null;
            }
        };

        ANRA.prototype.receive = function (channelIndex, carrierDetail, time) {
            this.$$checkChannelIndexRange(channelIndex);
            return this.$$stateMachineManager[channelIndex].receive(carrierDetail, time);
        };

        return ANRA;
    }

    return _AudioNetworkReceiveAdapter();        // TODO change it to dependency injection

})();
