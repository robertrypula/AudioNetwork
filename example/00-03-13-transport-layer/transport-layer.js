// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    transportLayerBuilder,
    transportLayer,
    log = [];

function init() {
    transportLayerBuilder = new TransportLayerBuilder();
    transportLayer = transportLayerBuilder
        .rxConfigListener(rxConfigListener)
        .txConfigListener(txConfigListener)
        .configListener(configListener)
        .rxSampleListener(rxSampleListener)
        .build();
}

function logDump() {
    var i, j;

    for (i = 0; i < log.length; i++) {
        for (j = 0; j < log[i].frequencyData.length; j++) {
            log[i].frequencyData[j] = parseFloat(log[i].frequencyData[j].toFixed(1));
        }
    }
    document.getElementById('log').value = JSON.stringify(log);
}

function rxSampleListener(state) {
    log.push(state);
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

function onSendTwoWaySyncClick() {
    transportLayer.txTwoWaySync();
}

function onTxSampleRateClick(txSampleRate) {
    transportLayer.setTxSampleRate(txSampleRate);
}

function onLoopbackClick(state) {
    transportLayer.setLoopback(state);
}

// --------- TODO remove code below - only tests

function clientConnect() {
    transportLayer.clientConnect();
}

function clientDisconnect() {
    transportLayer.clientDisconnect();
}

function clientStartFakeTransmission() {
    transportLayer.clientStartFakeTransmission();
}

function serverListen() {
    transportLayer.serverListen();
}

function serverDisconnect() {
    transportLayer.serverDisconnect();
}
