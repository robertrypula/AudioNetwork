// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    UNICODE_UNKNOWN = '�',
    dataLinkLayer,
    receivedPacketList = [],
    asciiList;

function init() {
    dataLinkLayer = new DataLinkLayer(stateHandler);
    asciiList = new Buffer(20);
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

    html('#rx-byte-buffer', getStringFromByteList(state.byteBuffer));
    html('#rx-frame-list', receivedPacketList.join('<br/>'));
    html('#rx-ascii-list', asciiList.getAll().join(''));
}

function stateHandler(state) {
    var i, j, str, char, charCode;

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

    updateView(state);
}

function onConnectClick(sampleRate) {
    dataLinkLayer.connect(sampleRate);
    // refreshTxSymbolQueue();
}

function onSendByteHexClick() {
    var
        data = document.getElementById('tx-byte-hex-field').value,
        dataSplit = data.split(' '),
        byteList = [],
        byteHex,
        i;

    for (i = 0; i < dataSplit.length; i++) {
        byteHex = parseInt(dataSplit[i], 16);
        if (0 <= byteHex && byteHex <= 255) {
            byteList.push(byteHex);
        }
    }

    dataLinkLayer.send(byteList);
}

function onSendTextClick() {
    var
        text = document.getElementById('tx-text-field').value,
        data = [],
        byte,
        i;

    for (i = 0; i < text.length; i++) {
        byte = isPrintableAscii(text[i]) ? text.charCodeAt(i) : ASCII_NULL;
        if (0 <= byte && byte <= 255) {
            data.push(byte);
        }
    }
    dataLinkLayer.send(data);
}

// ---------------------------------------

function isPrintableAscii(char) {
    return char >= ' ' && char <= '~';
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
