/*
function receiveSampler(channelIndex, symbolData, time) {
    var 
        uiState = document.getElementById('rx-sampling-state-' + channelIndex),
        uiSymbol = document.getElementById('rx-sampling-symbol-' + channelIndex),
        uiPacket = document.getElementById('rx-sampling-packet-' + channelIndex),
        uiPacketHistory = document.getElementById('rx-sampling-packet-history-' + channelIndex),
        str, i
    ;

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
*/

function receive(channelIndex, carrierDetail/*, time*/) {
    var
        pskSize = getIntById('rx-psk-size-' + channelIndex),
        powerThreshold = getIntById('rx-power-threshold-' + channelIndex),
        i, j, elementPower, elementPhase, elementSymbolContainer, elementSymbolList, cd, symbol
    ;

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
    }
}
