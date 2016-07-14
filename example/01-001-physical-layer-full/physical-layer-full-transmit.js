// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl

function transmitSymbol(channelIndex, ofdmIndex, symbol) {
    var 
        pskSize = getIntById('tx-psk-size-' + channelIndex),
        symbolDuration = getFloatById('symbol-duration') / 1000
    ;

    transmitAdapter.symbol(channelIndex, ofdmIndex, symbol, pskSize, symbolDuration);
}

function transmitPacket(channelIndex) {
    var 
        dataStr = getStrById('tx-packet-data-' + channelIndex),
        syncPreamble = !!document.getElementById('sync-preamble').checked,
        pskSize = getIntById('tx-psk-size-' + channelIndex),
        symbolDuration = getFloatById('symbol-duration') / 1000,
        guardInterval = getFloatById('guard-interval') / 1000,
        interpacketGap = getFloatById('interpacket-gap') / 1000,
        dataList, mute, symbol, symbolList, symbolListParsed, i, j,
        data = [],
        amplitude = []
    ;

    dataList = dataStr.split(' ');
    for (i = 0; i < dataList.length; i++) {
        symbolList = dataList[i].split('.');

        symbolListParsed = [];
        for (j = 0; j < symbolList.length; j++) {
            mute = symbolList[j] === '-';
            symbol = mute ? null : parseInt(symbolList[j]);
            if (i === 0) {
                amplitude.push(getFloatById('tx-amplitude-input-' + channelIndex + '-' + j));
            }
            symbolListParsed.push(symbol % pskSize);
        }

        data.push(symbolListParsed.length === 1 ? symbolListParsed[0] : symbolListParsed);
    }

    transmitAdapter.packet(channelIndex, data, syncPreamble, pskSize, symbolDuration, guardInterval, interpacketGap, amplitude);
}

function transmitSynchronization(channelIndex) {
    transmitAdapter.synchronization(channelIndex);
}
