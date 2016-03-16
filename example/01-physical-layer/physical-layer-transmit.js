var 
    SYNCHRONIZATION_SIGNAL_DURATION = 8,
    SYNCHRONIZATION_SIGNAL_GAP_DURATION = 1
;

function transmit(channelIndex) {
    var 
        dataPacket = getStrById('tx-data-packet-' + channelIndex),
        symbolDuration = getFloatById('symbol-duration') / 1000,
        guardInterval = getFloatById('guard-interval') / 1000
    ;

    transmitDataPacket(channelIndex, dataPacket, symbolDuration, guardInterval);
}

function transmitSynchronizationSignal(channelIndex) {
    var synchronizationSignal = '';

    for (i = 0; i < anpl.getRxChannelOfdmSize(channelIndex); i++) {
        synchronizationSignal += synchronizationSignal === '' ? '0' : '.0';
    }

    transmitDataPacket(
        channelIndex, 
        synchronizationSignal, 
        SYNCHRONIZATION_SIGNAL_DURATION, 
        SYNCHRONIZATION_SIGNAL_GAP_DURATION
    );
}

function transmitDataPacket(channelIndex, dataPacket, symbolDuration, guardInterval) {
    var
        pskSize = getIntById('tx-psk-size-' + channelIndex),
        ofdmBurstList = dataPacket.split(' '),
        ofdmBurstSymbolList, ofdmBurstSymbol,
        amplitude, data, dataPacketParsed, mute, i, j
        ;

    dataPacketParsed = [];
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
        dataPacketParsed.push(data);

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
        dataPacketParsed.push(data);
    }

    for (i = 0; i < dataPacketParsed.length; i++) {
        anpl.tx(channelIndex, dataPacketParsed[i]);
    }
}
