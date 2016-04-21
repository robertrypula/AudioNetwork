var AudioNetworkTransmitAdapter = (function () {
    'use strict';

    _AudioNetworkTransmitAdapter.$inject = [];

    _AudioNetworkTransmitAdapter.SYNCHRONIZATION = {
        PSK_SIZE: 1,
        SYMBOL: 0,
        SYMBOL_DURATION: 3.0,                         // TODO move to some common config
        GUARD_INTERVAL: 0.0,
        INTERPACKET_GAP: 0.5                          // TODO move to some common config
    };

    _AudioNetworkTransmitAdapter.PACKET = {
        PSK_SIZE: 4,                                  // TODO move to some common config
        SYMBOL_DURATION: 0.080,                       // TODO move to some common config
        GUARD_INTERVAL: 0.170,                        // TODO move to some common config
        INTERPACKET_GAP: 0.5                          // TODO move to some common config
    };

    _AudioNetworkTransmitAdapter.SYMBOL = {
        SYNC_PREAMBLE: false,                   // note: this is NOT default preamble value for sending packet
        SYMBOL_DURATION: _AudioNetworkTransmitAdapter.PACKET.SYMBOL_DURATION,     // TODO move to some common config
        GUARD_INTERVAL: 0.0,
        INTERPACKET_GAP: 0.0,
        AMPLITUDE: undefined
    };

    /**
     * This works as an wrapper for raw API that AudioNetworkPhysicalLayer provides.
     * It's much easier to send data using Adapter API. In case of really fancy sound
     * generation cases you can use AudioNetworkPhysicalLayer API directly.
     *
     */
    function _AudioNetworkTransmitAdapter() {
        var ANTA;

        ANTA = function (audioNetworkPhysicalLayer) {
            this.$$audioNetworkPhysicalLayer = audioNetworkPhysicalLayer;
        };

        ANTA.prototype.symbol = function (channelIndex, ofdmIndex, symbol, pskSize, symbolDuration) {
            var
                ofdmSize = this.$$audioNetworkPhysicalLayer.getTxChannelOfdmSize(channelIndex),
                data = [],
                i
            ;

            for (i = 0; i < ofdmSize; i++) {
                data.push(
                    i === ofdmIndex ? symbol : null
                );
            }
            data = [ data.length === 1 ? data[0] : data ];

            this.packet(
                channelIndex,
                data,
                _AudioNetworkTransmitAdapter.SYMBOL.SYNC_PREAMBLE,
                pskSize,
                typeof symbolDuration === 'undefined' ? _AudioNetworkTransmitAdapter.SYMBOL.SYMBOL_DURATION : symbolDuration,
                _AudioNetworkTransmitAdapter.SYMBOL.GUARD_INTERVAL,
                _AudioNetworkTransmitAdapter.SYMBOL.INTERPACKET_GAP,
                _AudioNetworkTransmitAdapter.SYMBOL.AMPLITUDE
            );
        };

        ANTA.prototype.packet = function (channelIndex, data, syncPreamble, pskSize, symbolDuration, guardInterval, interpacketGap, amplitude) {
            var 
                ofdmSize = this.$$audioNetworkPhysicalLayer.getTxChannelOfdmSize(channelIndex),
                syncData,
                i
            ;

            if (typeof syncPreamble === 'undefined' || syncPreamble) {
                syncData = [];
                for (i = 0; i < ofdmSize; i++) {
                    syncData.push(_AudioNetworkTransmitAdapter.SYNCHRONIZATION.SYMBOL);
                }
                syncData = syncData.length === 1 ? syncData[0] : syncData;
                data.unshift(syncData);
            }

            if (typeof amplitude === 'undefined') {
                amplitude = [];
                for (i = 0; i < ofdmSize; i++) {
                    amplitude.push(
                        Math.floor(1000 / ofdmSize) / 1000
                    );
                }
            }

            this.$$transmit(
                channelIndex, 
                data, 
                typeof pskSize === 'undefined' ? _AudioNetworkTransmitAdapter.PACKET.PSK_SIZE : pskSize,
                typeof symbolDuration === 'undefined' ? _AudioNetworkTransmitAdapter.PACKET.SYMBOL_DURATION : symbolDuration,
                typeof guardInterval === 'undefined' ? _AudioNetworkTransmitAdapter.PACKET.GUARD_INTERVAL : guardInterval,
                typeof interpacketGap === 'undefined' ? _AudioNetworkTransmitAdapter.PACKET.INTERPACKET_GAP : interpacketGap,
                amplitude
            );
        };

        ANTA.prototype.synchronization = function (channelIndex) {
            var 
                ofdmSize = this.$$audioNetworkPhysicalLayer.getTxChannelOfdmSize(channelIndex),
                data = [],
                amplitude = [],
                i
            ;

            for (i = 0; i < ofdmSize; i++) {
                data.push(_AudioNetworkTransmitAdapter.SYNCHRONIZATION.SYMBOL);
                amplitude.push(
                    Math.floor(1000 / ofdmSize) / 1000
                );
            }
            data = [ data.length === 1 ? data[0] : data ];

            this.$$transmit(
                channelIndex, 
                data, 
                _AudioNetworkTransmitAdapter.SYNCHRONIZATION.PSK_SIZE,
                _AudioNetworkTransmitAdapter.SYNCHRONIZATION.SYMBOL_DURATION, 
                _AudioNetworkTransmitAdapter.SYNCHRONIZATION.GUARD_INTERVAL,
                _AudioNetworkTransmitAdapter.SYNCHRONIZATION.INTERPACKET_GAP,
                amplitude
            );
        };

        ANTA.prototype.$$transmit = function (channelIndex, data, pskSize, symbolDuration, guardInterval, interpacketGap, amplitude) {
            var
                ofdmSize = this.$$audioNetworkPhysicalLayer.getTxChannelOfdmSize(channelIndex),
                symbolList, symbol,
                txData, txDataTmp,
                mute,
                i, j
            ;

            console.log(channelIndex, data, pskSize, symbolDuration, guardInterval, interpacketGap, amplitude);

            txData = [];
            for (i = 0; i < data.length; i++) {
                // allow simpler data structure for ofdm-1 (nested arrays are not needed in this case)
                if (ofdmSize === 1 && typeof data[i] === 'number') {
                    symbolList = [ data[i] ];
                } else {
                    symbolList = data[i];
                }

                if (symbolList.length !== amplitude.length) {
                    throw 'Amplitude data length does not match symbol list length';
                }

                txDataTmp = [];
                for (j = 0; j < symbolList.length; j++) {
                    mute = symbolList[j] === null;
                    symbol = mute ? 0 : parseInt(symbolList[j]) % pskSize;

                    txDataTmp.push({
                        amplitude: mute ? 0 : amplitude[j],
                        duration: symbolDuration,
                        phase: symbol / pskSize
                    });
                }
                txData.push(txDataTmp);

                if (guardInterval > 0) {
                    txDataTmp = [];
                    for (j = 0; j < symbolList.length; j++) {
                        txDataTmp.push({
                            amplitude: 0,
                            duration: guardInterval
                        });
                    }
                    txData.push(txDataTmp);
                }
            }

            // add interpacket gap only when data loop above actually added something
            if (interpacketGap > 0 && symbolList) {
                txDataTmp = [];
                for (j = 0; j < symbolList.length; j++) {
                    txDataTmp.push({
                        amplitude: 0,
                        duration: interpacketGap
                    });
                }
                txData.push(txDataTmp);
            }

            for (i = 0; i < txData.length; i++) {
                this.$$audioNetworkPhysicalLayer.tx(channelIndex, txData[i]);
            }
        };

        return ANTA;
    }

    return _AudioNetworkTransmitAdapter();        // TODO change it to dependency injection

})();
