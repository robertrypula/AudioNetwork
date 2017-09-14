// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    dataLinkLayerBuilder,
    dataLinkLayer;

function init() {
    dataLinkLayerBuilder = new DataLinkLayerBuilder();
    dataLinkLayer = dataLinkLayerBuilder
        .frameListener(frameListener)
        .frameCandidateListener(frameCandidateListener)
        .rxSampleListener(rxSampleListener)
        .configListener(configListener)
        .txConfigListener(txConfigListener)
        .rxConfigListener(rxConfigListener)
        .txListener(txListener)
        .build();
}

function frameListener(frame) {
    addClass('#rx-frame > div', 'visible');
    html('#rx-frame-is-command', frame.isCommand ? 'yes' : 'no');
    html('#rx-frame-payload', getByteHexFromByteList(frame.payload));
}

function frameCandidateListener(frameCandidateList) {
    var fc, progress = '';

    if (frameCandidateList.length > 0) {
        fc = frameCandidateList[0];
        progress =
            fc.received.length + '/' + fc.expected + ' ' +
            '(' + (100 * fc.received.length / fc.expected).toFixed(0) + '%)';
    }

    html('#rx-frame-candidate-progress', progress);
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

function txListener(state) {
    html('#tx-status', state.symbol || state.symbolQueue.length ? 'transmitting' : 'idle');
}

// ---------

function onSendCommandSetTxSampleRate44100Click() {
    dataLinkLayer.sendCommand(DataLinkLayer.COMMAND_SET_TX_SAMPLE_RATE_44100);
}

function onSendCommandSetTxSampleRate48000Click() {
    dataLinkLayer.sendCommand(DataLinkLayer.COMMAND_SET_TX_SAMPLE_RATE_48000);
}

function onSendCommandTxSyncClick() {
    dataLinkLayer.sendCommand(DataLinkLayer.COMMAND_TX_SYNC);
}

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
        textSplit = getFormFieldValue('#tx-hex', 'split'),
        payload = [],
        byte,
        i;

    for (i = 0; i < textSplit.length; i++) {
        byte = parseInt(textSplit[i], 16);
        if (0 <= byte && byte <= 255) {
            payload.push(byte);
        }
    }
    try {
        dataLinkLayer.sendFrame(payload);
    } catch (e) {
        alert(e);
    }
}

// ---------

function getByteHexFromByte(byte) {
    var byteHex = byte.toString(16);

    return pad(byteHex, 2)
}

function getByteHexFromByteList(byteList) {
    var i, byte, result = [];

    for (i = 0; i < byteList.length; i++) {
        byte = byteList[i];
        result.push(
            getByteHexFromByte(byte)
        );
    }

    return result.join(' ');
}

function pad(num, size) {
    var s = '000000000' + num;

    return s.substr(s.length - size);
}
