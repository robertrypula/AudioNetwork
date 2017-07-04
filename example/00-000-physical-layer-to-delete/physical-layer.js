// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    physicalLayer,
    rxRawSampleOffset;

function init() {
    physicalLayer = new PhysicalLayer();
    physicalLayer.setReceiveHandler(receiveHandler);

    document.getElementById('rx-sample-rate').innerHTML = physicalLayer.getReceiveSampleRate();

    rxRawSampleOffset = new EditableFloatWidget(
        document.getElementById('rx-raw-sample-offset'),
        0, 2, 0,
        onRxRawSampleOffsetChange
    );

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    physicalLayer.setLoopback(document.getElementById('loopback-checkbox').checked);
}

function onReceptionModeChange(event) {
    var
        mode = event.target.value,
        receiveBand,
        receiveSpeed,
        receiveSymbol;

    physicalLayer.setReceiverMode(mode);
    receiveBand = physicalLayer.getReceiveBand();
    receiveSpeed = physicalLayer.getReceiveSpeed();
    receiveSymbol = physicalLayer.getReceiveSymbol();

    if (receiveBand === null) {
        document.getElementById('rx-detail').innerHTML = '';
    } else {
        document.getElementById('rx-detail').innerHTML =
            'Frequency: ' + receiveBand.frequencyStart.toFixed(0) + ' Hz - ' + receiveBand.frequencyEnd.toFixed(0) + ' Hz<br/>' +
            'Speed: ' + receiveSpeed.bitPerSymbol + ' bits/symbol, ' + receiveSpeed.symbolPerSecond.toFixed(2) + ' symbols/second<br/>' +
            'Symbol range: ' + receiveSymbol.dataMin + ' - ' + receiveSymbol.frameEnd;
    }
}

function onTransmissionModeChange(event) {
    var
        modeRaw = event.target.value,
        modeSplit,
        mode,
        sampleRate;

    if (modeRaw === 'MODE_DISABLED') {
        mode = modeRaw;
        sampleRate = 0;
    } else {
        modeSplit = modeRaw.split('__');
        mode = modeSplit[0];
        sampleRate = parseInt(modeSplit[1]);
    }

    physicalLayer.setTransmitterMode(mode, sampleRate);
}

function onRxRawSampleOffsetChange() {
    physicalLayer.setReceiveRawSampleOffset(rxRawSampleOffset.getValue());
}

function onTxAddToQueueNearTextarea() {
    var
        contentRaw = document.getElementById('tx-symbol-edit').value,
        content = contentRaw.trim().replace(/ +(?= )/g, ''),
        symbolList = content.split(' '),
        symbol,
        i;

    for (i = 0; i < symbolList.length; i++) {
        symbol = parseInt(symbolList[i]);
        physicalLayer.transmit(symbol);
    }
}

function receiveHandler(data) {
    var htmlString;

    if (document.getElementById('rx-symbol-log-checkbox').checked) {
        htmlString = '<span>' +
            data.symbol + //', ' + data.symbolDecibel.toFixed(1) + ' | ' +
            '</span>, ';
        html('#rx-symbol-log', htmlString, true);
    }
}
