// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var dataLinkLayer;

function init() {
    dataLinkLayer = new DataLinkLayer(stateHandler);
    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    dataLinkLayer.setLoopback(
        document.getElementById('loopback-checkbox').checked
    );
}

function updateView(state) {
    var plState = state.physicalLayerState;

    if (plState.isConnectionInProgress) {
        html('#rx-connect-status', 'connecting...');
    } else {
        html('#rx-connect-status', plState.isConnected ? 'Connected!' : 'not connected');
    }

    html('#rx-frame-candidates', getStringFromByteList(state.byteBuffer));
}

function stateHandler(state) {
    console.log(state);
    updateView(state);
}

function onConnectClick(sampleRate) {
    dataLinkLayer.connect(sampleRate);
    // refreshTxSymbolQueue();
}

// ---------------------------------------

function pad(num, size) {
    var s = '000000000' + num;

    return s.substr(s.length - size);
}

function getStringFromByteList(byteList) {
    var i, tmp, formatted = [];

    for (i = 0; i < byteList.length; i++) {
        tmp = pad(byteList[i].toString(16), 2);
        formatted.push(tmp);
    }

    return formatted.join(' ');
}
