var RECEIVE_SAMPLE_STATE = {
    IDLE: 'IDLE',
    SYMBOL: 'SYMBOL',
    GUARD: 'GUARD',
    ERROR: 'ERROR'
};
var receiveSamplerState = RECEIVE_SAMPLE_STATE.IDLE;
var receiveSymbolData = [];
var receivePacket = [];
var receivePacketHistory = [];
var receiveStateDuration = 0;
var receiveStateBegin = null;


function handleFirstSymbolInPacket(symbolData) {
    var 
        syncPreamble = !!document.getElementById('sync-preamble').checked,
        current
    ;

    // console.log('FIRST SYMBOL ', symbolData);
    // console.log('----------');

    if (syncPreamble) {
        current = anpl.getRxPhaseCorrection(0, 0);
        anpl.setRxPhaseCorrection(0, 0, current + symbolData.phase);
    }
}

function getSymbolWithBestQuality(symbolDataList) {
    var symbol = 0, i, bestQualityIndex, maxPower;

    if (symbolDataList.length === 0) {
        throw 'Something went wrong at symbol decision';
    }

    maxPower = -100;
    for (i = 0; i < symbolDataList.length; i++)  {
        if (symbolDataList[i].powerDecibel > maxPower) {
            bestQualityIndex = i;
            maxPower = symbolDataList[i].powerDecibel;
        }
    }

    // console.log(symbolDataList);
    // console.log(bestQualityIndex);
    // console.log('-------');

    return symbolDataList[bestQualityIndex];
}

// . . . . 0 0 0 . . .

function receiveSamplerIddle(symbolData, time) {
    if (symbolData.symbol !== null) {
        receiveSamplerState = RECEIVE_SAMPLE_STATE.SYMBOL;
        receiveStateBegin = time;
        receiveSamplerSymbol(symbolData, time);
    } else {
        receiveStateDuration = time - receiveStateBegin;

        if (receivePacket.length > 0) {
            receivePacketHistory.push(receivePacket);
            receivePacket = [];
        }
    }
}

function receiveSamplerSymbol(symbolData, time) {
    if (symbolData.symbol === null) {
        receiveSamplerState = RECEIVE_SAMPLE_STATE.GUARD;
        receiveStateBegin = time;
        receiveSamplerGuard(symbolData, time);
    } else {
        receiveStateDuration = time - receiveStateBegin;

        receiveSymbolData.push(symbolData);

        if (receiveStateDuration > 1.0) {
            // receiveSamplerState = RECEIVE_SAMPLE_STATE.ERROR;
            // receiveStateBegin = time;
            // receiveSamplerIddle(symbolData, time);
        }
    }
}

function receiveSamplerGuard(symbolData, time) {
    var symbolWithBestQuality;

    if (symbolData.symbol !== null) {
        receiveSamplerState = RECEIVE_SAMPLE_STATE.SYMBOL;
        receiveStateBegin = time;
        receiveSamplerSymbol(symbolData, time);
    } else {
        receiveStateDuration = time - receiveStateBegin;

        if (receiveSymbolData.length > 0) {
            symbolWithBestQuality = getSymbolWithBestQuality(receiveSymbolData);
            receivePacket.push(symbolWithBestQuality.symbol);
            if (receivePacket.length === 1) {
                handleFirstSymbolInPacket(symbolWithBestQuality);
            }
            receiveSymbolData = [];
        }

        if (receiveStateDuration > 1.0) {
            receiveSamplerState = RECEIVE_SAMPLE_STATE.IDLE;
            receiveStateBegin = time;
            receiveSamplerIddle(symbolData, time);
        }
    }
}

function receiveSampler(channelIndex, symbolData, time) {
    var 
        uiState = document.getElementById('rx-sampling-state-' + channelIndex),
        uiSymbol = document.getElementById('rx-sampling-symbol-' + channelIndex),
        uiPacket = document.getElementById('rx-sampling-packet-' + channelIndex),
        uiPacketHistory = document.getElementById('rx-sampling-packet-history-' + channelIndex),
        str, i
    ;

    if (!symbolData) {
        return;
    }

    if (receiveStateBegin === null) {
        receiveStateBegin = time;
    }

    switch (receiveSamplerState) {
        case RECEIVE_SAMPLE_STATE.IDLE:
            receiveSamplerIddle(symbolData, time);
            break;
        case RECEIVE_SAMPLE_STATE.SYMBOL:
            receiveSamplerSymbol(symbolData, time);
            break;
        case RECEIVE_SAMPLE_STATE.GUARD:
            receiveSamplerGuard(symbolData, time);
            break;
    }

    uiState.innerHTML = receiveSamplerState + '&nbsp;';

    str = '';
    for (i = receiveSymbolData.length - 1; i >= 0; i--) {
        str += (
            Math.round(receiveSymbolData[i].powerDecibel) + ', ' +
            receiveSymbolData[i].symbol + ', ' +
            Math.round(receiveSymbolData[i].phase * 100) / 100 +
            ' | '
        );
    }
    uiSymbol.innerHTML = str + '&nbsp;';

    uiPacket.innerHTML = receivePacket.join(', ') + '&nbsp;';

    str = '';
    for (i = receivePacketHistory.length - 1; i >= 0; i--) {
        str += receivePacketHistory[i].join(', ') + '<br/>';
    }
    uiPacketHistory.innerHTML = str + '&nbsp;';
}

function receive(channelIndex, carrierDetail, time) {
    var
        pskSize = getIntById('rx-psk-size-' + channelIndex),
        powerThreshold = getIntById('rx-power-threshold-' + channelIndex),
        i, j, elementPower, elementPhase, elementSymbolContainer, elementSymbolList, cd, symbol,
        sampleTestSymbol
    ;

    sampleTestSymbol = null;
    // console.log(time);   // TODO remove me

    for (i = 0; i < carrierDetail.length; i++) {
        elementPower = document.getElementById('rx-power-' + channelIndex + '-' + i);
        elementPhase = document.getElementById('rx-phase-' + channelIndex + '-' + i);
        elementSymbolContainer = document.getElementById('rx-symbol-' + channelIndex + '-' + i);
        elementSymbolList = document.querySelectorAll('#rx-symbol-' + channelIndex + '-' + i + ' > span');

        cd = carrierDetail[i];

        if (cd.powerDecibel >= powerThreshold) {
            symbol = Math.round(cd.phase * pskSize) % pskSize;
        } else {
            symbol = null;
        }

        for (j = 0; j < elementSymbolList.length; j++) {
            elementSymbolList[j].className = j === symbol ? 'active' : '';
        }
        elementPower.innerHTML = Math.round(cd.powerDecibel);
        elementPhase.innerHTML = (
            Math.round(cd.phase * 360) + ', ' +
            Math.round(cd.phase * 100) / 100
        );


        // so far only 1 OFDM subcarrier works
        if (carrierDetail.length === 1) {
            sampleTestSymbol = {
                symbol: symbol,
                phase: cd.phase,
                powerDecibel: cd.powerDecibel
            };
        }
    }

    receiveSampler(channelIndex, sampleTestSymbol, time);
}
