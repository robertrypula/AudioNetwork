var TransmitAdapter = (function () {
    'use strict';

    _TransmitAdapter.$inject = [];

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

        TA.AMPLITUDE_DATA_LENGTH_DOES_NOT_MATCH_SYMBOL_LIST_LENGTH_EXCEPTION = 'Amplitude data length does not match symbol list length';
        TA.$$_SYNCHRONIZATION_SYMBOL = 0;
        TA.$$_LOWEST_PSK_SIZE = 1;
        TA.$$_ZERO_GUARD_INTERVAL = 0;
        TA.$$_ZERO_INTERPACKET_GAP = 0;
        TA.$$_NO_SYNC_PREAMBLE = false;
        TA.$$_UNDEFINED_AMPLITUDE = undefined;

        TA.prototype.symbol = function (channelIndex, ofdmIndex, symbol, pskSize, symbolDuration) {
            var
                ofdmSize = this.$$physicalLayer.getTxChannelOfdmSize(channelIndex),
                data = [],
                i
            ;

            for (i = 0; i < ofdmSize; i++) {
                data.push(i === ofdmIndex ? symbol : null);
            }
            data = [ data.length === 1 ? data[0] : data ];

            this.packet(
                channelIndex,
                data,
                TA.$$_NO_SYNC_PREAMBLE,
                pskSize,
                Util.valueOrDefault(symbolDuration, DefaultConfig.SYMBOL_DURATION),
                TA.$$_ZERO_GUARD_INTERVAL,
                TA.$$_ZERO_INTERPACKET_GAP,
                TA.$$_UNDEFINED_AMPLITUDE
            );
        };

        TA.prototype.packet = function (channelIndex, data, syncPreamble, pskSize, symbolDuration, guardInterval, interpacketGap, amplitude) {
            var 
                ofdmSize = this.$$physicalLayer.getTxChannelOfdmSize(channelIndex),
                syncData,
                i
            ;

            syncPreamble = Util.valueOrDefault(syncPreamble, DefaultConfig.SYNC_PREAMBLE);
            if (syncPreamble) {
                syncData = [];
                for (i = 0; i < ofdmSize; i++) {
                    syncData.push(TA.$$_SYNCHRONIZATION_SYMBOL);
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
                Util.valueOrDefault(pskSize, DefaultConfig.PSK_SIZE),
                Util.valueOrDefault(symbolDuration, DefaultConfig.SYMBOL_DURATION),
                Util.valueOrDefault(guardInterval, DefaultConfig.GUARD_INTERVAL),
                Util.valueOrDefault(interpacketGap, DefaultConfig.INTERPACKET_GAP),
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
                data.push(TA.$$_SYNCHRONIZATION_SYMBOL);
                amplitude.push(
                    MathUtil.floor(1000 / ofdmSize) / 1000
                );
            }
            data = [ data.length === 1 ? data[0] : data ];

            this.$$transmit(
                channelIndex, 
                data, 
                TA.$$_LOWEST_PSK_SIZE,
                DefaultConfig.SYNC_DURATION,
                TA.$$_ZERO_GUARD_INTERVAL,
                DefaultConfig.INTERPACKET_GAP,
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
                    throw TA.AMPLITUDE_DATA_LENGTH_DOES_NOT_MATCH_SYMBOL_LIST_LENGTH_EXCEPTION;
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
