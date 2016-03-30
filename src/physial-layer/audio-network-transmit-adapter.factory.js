var AudioNetworkTransmitAdapter = (function () {
    'use strict';

    _AudioNetworkTransmitAdapter.$inject = [];

    /**
     * This works as an wrapper for raw API that AudioNetworkPhysicalLayter provides.
     */
    function _AudioNetworkTransmitAdapter() {
        var ANTA;

        ANTA = function (audioNetworkPhysicalLayer) {
            this.$$audioNetworkPhysicalLayer = audioNetworkPhysicalLayer;
        };

        ANTA.prototype.$$transmit = function (channelIndex, data, amplitude, pskSize, symbolDuration, guardInterval, interpacketGap) {
            var
                symbolList, symbol,
                txData, txDataTmp,
                mute,
                i, j
            ;

            txData = [];
            for (i = 0; i < data.length; i++) {
                symbolList = data[i];

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

            // add interpacket gap only when previous loop
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

        ANTA.prototype.destroy = function () {
            
        };

        return ANTA;
    }

    return _AudioNetworkTransmitAdapter();        // TODO change it to dependency injection

})();
