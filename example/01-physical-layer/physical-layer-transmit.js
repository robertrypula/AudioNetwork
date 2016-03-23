var 
    SYNCHRONIZATION_SYMBOL_DURATION = 8.0,
    SYNCHRONIZATION_GUARD_INTERVAL = 0.0,
    SYNCHRONIZATION_INTERPACKET_GAP = 1.0
;

function transmitSymbol(channelIndex, packetData) {
    // TODO refactor to: transmitSymbol(channelIndex, ofdmIndex, symbol);
    var 
        symbolDuration = getFloatById('symbol-duration') / 1000,
        guardInterval = getFloatById('guard-interval') / 1000,
        interpacketGap = getFloatById('interpacket-gap') / 1000
    ;

    $$transmit(channelIndex, packetData, symbolDuration, guardInterval, interpacketGap);
}

function transmitPacket(channelIndex) {
    var 
        packetData = getStrById('tx-packet-data-' + channelIndex),
        symbolDuration = getFloatById('symbol-duration') / 1000,
        guardInterval = getFloatById('guard-interval') / 1000,
        interpacketGap = getFloatById('interpacket-gap') / 1000
    ;

    // TODO use syncPreamble
    // syncPreamble = !!document.getElementById('sync-preamble').checked

    $$transmit(channelIndex, packetData, symbolDuration, guardInterval, interpacketGap);
}

function transmitSynchronization(channelIndex) {
    var synchronizationData = '';

    for (i = 0; i < anpl.getRxChannelOfdmSize(channelIndex); i++) {
        synchronizationData += synchronizationData === '' ? '0' : '.0';
    }

    $$transmit(
        channelIndex, 
        synchronizationData, 
        SYNCHRONIZATION_SYMBOL_DURATION, 
        SYNCHRONIZATION_GUARD_INTERVAL,
        SYNCHRONIZATION_INTERPACKET_GAP
    );
}

function $$transmit(channelIndex, data, symbolDuration, guardInterval, interpacketGap) {
    var
        pskSize = getIntById('tx-psk-size-' + channelIndex),
        ofdmBurstList = data.split(' '),
        ofdmBurstSymbolList, ofdmBurstSymbol,
        amplitude, data, packetDataParsed, mute, i, j
    ;

    packetDataParsed = [];
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
        packetDataParsed.push(data);

        if (guardInterval > 0) {
            data = [];
            for (j = 0; j < ofdmBurstSymbolList.length; j++) {
                data.push({
                    amplitude: 0,
                    duration: guardInterval
                });
            }
            packetDataParsed.push(data);
        }
    }

    if (interpacketGap > 0 && ofdmBurstSymbolList) {
        data = [];
        for (j = 0; j < ofdmBurstSymbolList.length; j++) {
            data.push({
                amplitude: 0,
                duration: interpacketGap
            });
        }
        packetDataParsed.push(data);
    }

    for (i = 0; i < packetDataParsed.length; i++) {
        anpl.tx(channelIndex, packetDataParsed[i]);
    }
}
