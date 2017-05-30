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
    var mode = event.target.value;

    physicalLayer.setReceiverMode(mode);
    console.log(physicalLayer.getReceiveBand());
    console.log(physicalLayer.getReceiveSpeed());
    console.log(physicalLayer.getReceiveSymbol());
    console.log(physicalLayer.getReceiveRawSampleOffset());
}

function onTransmissionModeChange(event) {
    var
        mode = event.target.value,
        radioList = document.getElementsByName('tx-sample-rate'),
        sampleRate,
        i;

    for (i = 0; i < radioList.length; i++) {
        if (radioList[i].checked) {
            sampleRate = parseInt(radioList[i].value);
            break;
        }
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
