function transmit(channelIndex) {
    var dataFrame = getStrById('tx-data-frame-' + channelIndex);

    transmitDataFrame(channelIndex, dataFrame);
}

function transmitDataFrame(channelIndex, dataFrame) {
    var
        symbolDuration = getFloatById('symbol-duration') / 1000,
        guardInterval = getFloatById('guard-interval') / 1000,
        pskSize = getIntById('tx-psk-size-' + channelIndex),
        ofdmBurstList = dataFrame.split(' '),
        ofdmBurstSymbolList, ofdmBurstSymbol,
        amplitude, data, dataFrameParsed, mute, i, j
        ;

    dataFrameParsed = [];
    for (i = 0; i < ofdmBurstList.length; i++) {
        ofdmBurstSymbolList = ofdmBurstList[i].split('.');

        data = [];
        for (j = 0; j < ofdmBurstSymbolList.length; j++) {
            mute = ofdmBurstSymbolList[j] === '-';
            ofdmBurstSymbol = mute ? 0 : parseInt(ofdmBurstSymbolList[j]) % pskSize;
            amplitude = getFloatById('tx-amplitude-input-' + channelIndex + '-' + j);

            data.push({
                amplitude: mute ? 0 : amplitude,
                duration: symbolDuration,
                phase: ofdmBurstSymbol / pskSize
            });
        }
        dataFrameParsed.push(data);

        if (guardInterval === 0) {
            continue;
        }

        data = [];
        for (j = 0; j < ofdmBurstSymbolList.length; j++) {
            data.push({
                amplitude: 0,
                duration: guardInterval
            });
        }
        dataFrameParsed.push(data);
    }

    for (i = 0; i < dataFrameParsed.length; i++) {
        anpl.tx(channelIndex, dataFrameParsed[i]);
    }
}
