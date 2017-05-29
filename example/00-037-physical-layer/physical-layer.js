// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    physicalLayer,
    rxRawSampleOffset;

function init() {
    physicalLayer = new PhysicalLayer();
    physicalLayer.setReceiveHandler(receiveHandler);

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

function receiveHandler(data) {
    var htmlString;

    if (document.getElementById('rx-symbol-log-checkbox').checked) {
        htmlString = '<span>' +
            data.symbol +
            '</span>, ';
        html('#rx-symbol-log', htmlString, true);
    }
}
