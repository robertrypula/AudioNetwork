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
        .rxSampleDspDetailsListener(rxSampleDspDetailsListener)
        .dspConfigListener(dspConfigListener)
        .txDspConfigListener(txDspConfigListener)
        .rxDspConfigListener(rxDspConfigListener)
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

function rxSampleDspDetailsListener(state) {
    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');
}

function dspConfigListener(state) {
    setActive(
        '#loopback-container',
        '#loopback-' + (state.isLoopbackEnabled ? 'enabled' : 'disabled')
    );
}

function txDspConfigListener(state) {
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.txSampleRate);
}

function rxDspConfigListener(state) {
    html('#rx-sample-rate', (state.rxSampleRate / 1000).toFixed(1));
}

function txListener(state) {
    html('#tx-status', state.isTxInProgress ? 'transmitting' : 'idle');
}

// ---------

function onSendTwoWaySyncClick() {
    dataLinkLayer.txTwoWaySync();
}

function onTxSampleRateClick(txSampleRate) {
    dataLinkLayer.setTxSampleRate(txSampleRate);
}

function onLoopbackClick(state) {
    dataLinkLayer.setLoopback(state);
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
        dataLinkLayer.txFrame(payload);
    } catch (e) {
        alert(e);
    }
}
