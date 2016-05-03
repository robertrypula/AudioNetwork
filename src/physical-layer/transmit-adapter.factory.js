var TransmitAdapter = (function () {
    'use strict';

    _TransmitAdapter.$inject = [];

    _TransmitAdapter.SYNCHRONIZATION = {
        PSK_SIZE: 1,
        SYMBOL: 0,
        SYMBOL_DURATION: 3.0,                         // TODO move to some common config
        GUARD_INTERVAL: 0.0,
        INTERPACKET_GAP: 0.5                          // TODO move to some common config
    };

    _TransmitAdapter.PACKET = {
        PSK_SIZE: 4,                                  // TODO move to some common config
        SYMBOL_DURATION: 0.080,                       // TODO move to some common config
        GUARD_INTERVAL: 0.170,                        // TODO move to some common config
        INTERPACKET_GAP: 0.5                          // TODO move to some common config
    };

    _TransmitAdapter.SYMBOL = {
        SYNC_PREAMBLE: false,                   // note: this is NOT default preamble value for sending packet
        SYMBOL_DURATION: _TransmitAdapter.PACKET.SYMBOL_DURATION,     // TODO move to some common config
        GUARD_INTERVAL: 0.0,
        INTERPACKET_GAP: 0.0,
        AMPLITUDE: undefined
    };

    /**
     * This works as an wrapper for raw API that PhysicalLayer provides.
     * It's much easier to send data using Adapter API. In case of really fancy sound
     * generation cases you can use PhysicalLayer API directly.
     *
     */
    function _TransmitAdapter() {
        var TA;

        TA = function (physicalLayer) {
            this.$$physicalLayer = physicalLayer;
        };

        TA.prototype.symbol = function (channelIndex, ofdmIndex, symbol, pskSize, symbolDuration) {
            var
                ofdmSize = this.$$physicalLayer.getTxChannelOfdmSize(channelIndex),
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
                _TransmitAdapter.SYMBOL.SYNC_PREAMBLE,
                pskSize,
                typeof symbolDuration === 'undefined' ? _TransmitAdapter.SYMBOL.SYMBOL_DURATION : symbolDuration,
                _TransmitAdapter.SYMBOL.GUARD_INTERVAL,
                _TransmitAdapter.SYMBOL.INTERPACKET_GAP,
                _TransmitAdapter.SYMBOL.AMPLITUDE
            );
        };

        TA.prototype.packet = function (channelIndex, data, syncPreamble, pskSize, symbolDuration, guardInterval, interpacketGap, amplitude) {
            var 
                ofdmSize = this.$$physicalLayer.getTxChannelOfdmSize(channelIndex),
                syncData,
                i
            ;

            if (typeof syncPreamble === 'undefined' || syncPreamble) {
                syncData = [];
                for (i = 0; i < ofdmSize; i++) {
                    syncData.push(_TransmitAdapter.SYNCHRONIZATION.SYMBOL);
                }
                syncData = syncData.length === 1 ? syncData[0] : syncData;
                data.unshift(syncData);
            }

            if (typeof amplitude === 'undefined') {
                amplitude = [];
                for (i = 0; i < ofdmSize; i++) {
                    amplitude.push(
                        MathUtil.floor(1000 / ofdmSize) / 1000
                    );
                }
            }

            this.$$transmit(
                channelIndex, 
                data, 
                typeof pskSize === 'undefined' ? _TransmitAdapter.PACKET.PSK_SIZE : pskSize,
                typeof symbolDuration === 'undefined' ? _TransmitAdapter.PACKET.SYMBOL_DURATION : symbolDuration,
                typeof guardInterval === 'undefined' ? _TransmitAdapter.PACKET.GUARD_INTERVAL : guardInterval,
                typeof interpacketGap === 'undefined' ? _TransmitAdapter.PACKET.INTERPACKET_GAP : interpacketGap,
                amplitude
            );
        };

        TA.prototype.synchronization = function (channelIndex) {
            var 
                ofdmSize = this.$$physicalLayer.getTxChannelOfdmSize(channelIndex),
                data = [],
                amplitude = [],
                i
            ;

            for (i = 0; i < ofdmSize; i++) {
                data.push(_TransmitAdapter.SYNCHRONIZATION.SYMBOL);
                amplitude.push(
                    MathUtil.floor(1000 / ofdmSize) / 1000
                );
            }
            data = [ data.length === 1 ? data[0] : data ];

            this.$$transmit(
                channelIndex, 
                data, 
                _TransmitAdapter.SYNCHRONIZATION.PSK_SIZE,
                _TransmitAdapter.SYNCHRONIZATION.SYMBOL_DURATION, 
                _TransmitAdapter.SYNCHRONIZATION.GUARD_INTERVAL,
                _TransmitAdapter.SYNCHRONIZATION.INTERPACKET_GAP,
                amplitude
            );
        };

        TA.prototype.$$transmit = function (channelIndex, data, pskSize, symbolDuration, guardInterval, interpacketGap, amplitude) {
            var
                ofdmSize = this.$$physicalLayer.getTxChannelOfdmSize(channelIndex),
                symbolList, symbol,
                txData, txDataTmp,
                mute,
                i, j
            ;

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
                this.$$physicalLayer.tx(channelIndex, txData[i]);
            }
        };

        return TA;
    }

    return _TransmitAdapter();        // TODO change it to dependency injection

})();
