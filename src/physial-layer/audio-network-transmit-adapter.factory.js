var AudioNetworkTransmitAdapter = (function () {
    'use strict';

    _AudioNetworkTransmitAdapter.$inject = [];

    /**
     * This works as an wrapper for raw API that AudioNetworkPhysicalLayter provides. 
     * It's much easier to send data using Adapter API. In case of realy fancy sound 
     * generation cases you can use AudioNetworkPhysicalLayter API directly.
     * 
     */
    function _AudioNetworkTransmitAdapter() {
        var 
            ANTA,
            SYNCHRONIZATION_PSK_SIZE = 1,
            SYNCHRONIZATION_SYMBOL = 0,
            SYNCHRONIZATION_SYMBOL_DURATION = 8.0,
            SYNCHRONIZATION_GUARD_INTERVAL = 0.0,
            SYNCHRONIZATION_INTERPACKET_GAP = 1.0,
            DEFAULT_PACKET_PSK_SIZE = 4,
            DEFAULT_PACKET_SYMBOL_DURATION = 0.25,
            DEFAULT_PACKET_GUARD_INTERVAL = 0.25,
            DEFAULT_PACKET_INTERPACKET_GAP = 0.5,
            SYMBOL_SYNC_PREAMBLE = false,
            SYMBOL_SYMBOL_DURATION = DEFAULT_PACKET_SYMBOL_DURATION,
            SYMBOL_GUARD_INTERVAL = SYMBOL_SYNC_PREAMBLE ? DEFAULT_PACKET_GUARD_INTERVAL : 0.0,
            SYMBOL_INTERPACKET_GAP = 0.0,
            SYMBOL_AMPLITUDE = undefined
        ;

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
                SYMBOL_SYNC_PREAMBLE, 
                pskSize, 
                typeof symbolDuration === 'undefined' ? SYMBOL_SYMBOL_DURATION : symbolDuration,
                SYMBOL_GUARD_INTERVAL, 
                SYMBOL_INTERPACKET_GAP, 
                SYMBOL_AMPLITUDE
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
                    syncData.push(SYNCHRONIZATION_SYMBOL);
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
                typeof pskSize === 'undefined' ? DEFAULT_PACKET_PSK_SIZE : pskSize,
                typeof symbolDuration === 'undefined' ? DEFAULT_PACKET_SYMBOL_DURATION : symbolDuration,
                typeof guardInterval === 'undefined' ? DEFAULT_PACKET_GUARD_INTERVAL : guardInterval,
                typeof interpacketGap === 'undefined' ? DEFAULT_PACKET_INTERPACKET_GAP : interpacketGap,
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
                data.push(SYNCHRONIZATION_SYMBOL);
                amplitude.push(
                    Math.floor(1000 / ofdmSize) / 1000
                );
            }
            data = [ data.length === 1 ? data[0] : data ];

            this.$$transmit(
                channelIndex, 
                data, 
                SYNCHRONIZATION_PSK_SIZE,
                SYNCHRONIZATION_SYMBOL_DURATION, 
                SYNCHRONIZATION_GUARD_INTERVAL,
                SYNCHRONIZATION_INTERPACKET_GAP,
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

            // add interpacket gap only when data loop above acctually added something
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
