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
}

function onReceptionModeChange(event) {
    var mode = event.target.value;

    physicalLayer.setReceiverMode(mode);
    console.log(physicalLayer.getReceiveBand());
    console.log(physicalLayer.getReceiveSpeed());
    console.log(physicalLayer.getReceiveSymbol());
    console.log(physicalLayer.getReceiveRawSampleOffset());
}

function onRxRawSampleOffsetChange() {
    physicalLayer.setReceiveRawSampleOffset(rxRawSampleOffset.getValue());
}

function receiveHandler(data) {
    console.log(data);
}