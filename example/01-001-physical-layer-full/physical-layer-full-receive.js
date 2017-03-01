// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

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
