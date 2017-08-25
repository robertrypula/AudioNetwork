// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    ASCII_NULL = 0,
    UNICODE_UNKNOWN = '�',
    dataLinkLayerBuilder,
    dataLinkLayer,
    receivedPacketList = [],
    asciiList;


function init() {
    dataLinkLayerBuilder = new DataLinkLayerBuilder();
    dataLinkLayer = dataLinkLayerBuilder
        .txListener(txListener)
        .rxSampleListener(rxSampleListener)
        .configListener(configListener)
        .txConfigListener(txConfigListener)
        .rxConfigListener(rxConfigListener)
        .build();
}

function txListener(state) {
    // console.log(state);
}

function rxSampleListener(state) {
    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');
}

function configListener(state) {
    setActive(
        '#loopback-container',
        '#loopback-' + (state.isLoopbackEnabled ? 'enabled' : 'disabled')
    );
}

function txConfigListener(state) {
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.sampleRate);
}

function rxConfigListener(state) {
    html('#rx-sample-rate', (state.sampleRate / 1000).toFixed(1));
}

// ---------

function onTxSampleRateClick(txSampleRate) {
    dataLinkLayer.setTxSampleRate(txSampleRate);
}

function onLoopbackClick(state) {
    dataLinkLayer.setLoopback(state);
}

function onSendSyncClick() {
    dataLinkLayer.sendSync();
}

function onSendHexClick() {
    var
        text = getFormFieldValue('#tx-hex'),
        textCleaned = text.trim().replace(/ +(?= )/g, ''),
        textSplit = textCleaned.split(' '),
        payload = [],
        byte,
        i;

    for (i = 0; i < textSplit.length; i++) {
        byte = parseInt(textSplit[i], 16);
        if (0 <= byte && byte <= 255) {
            payload.push(byte);
        }
    }
    sendFrame(payload);
}

function onSendAsciiClick() {
    var
        text = document.getElementById('tx-ascii').value,
        payload = [],
        byte,
        i;

    for (i = 0; i < text.length; i++) {
        byte = isPrintableAscii(text[i])
            ? text.charCodeAt(i)
            : ASCII_NULL;
        payload.push(byte);
    }
    sendFrame(payload);
}

function sendFrame(payload) {
    try {
        dataLinkLayer.sendFrame(payload);
    } catch (e) {
        alert(e);
    }
}

// ---------

function isPrintableAscii(char) {
    return char >= ' ' && char <= '~';
}


// ----------------------------------------------------------

/*

function updateView(state) {
    var plState = state.physicalLayerState;

    if (plState.isConnectionInProgress) {
        html('#rx-connect-status', 'connecting...');
    } else {
        html('#rx-connect-status', plState.isConnected ? 'Connected!' : 'not connected');
    }

    html('#rx-byte-buffer', getStringFromByteList(state.byteBuffer));
    html('#rx-frame-list', receivedPacketList.join('<br/>'));
    html('#rx-ascii-list', asciiList.getAll().join(''));
}

function stateHandler(state) {
    var i, j, str, char, charCode;

    if (state.isFrameReadyToTake) {
        for (i = 0; i < state.validFrameList.length; i++) {
            str = getStringFromByteList(state.validFrameList[i].data);

            for (j = 0; j < state.validFrameList[i].data.length; j++) {
                charCode = state.validFrameList[i].data[j];
                char = String.fromCharCode(charCode);
                asciiList.pushEvenIfFull(
                    isPrintableAscii(char) ? char : UNICODE_UNKNOWN
                );
            }
            receivedPacketList.unshift(str);
        }
    }

    updateView(state);
}

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
*/