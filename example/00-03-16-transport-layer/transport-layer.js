// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    transportLayerBuilder,
    transportLayer;

function init() {
    transportLayerBuilder = new TransportLayerBuilder();
    transportLayer = transportLayerBuilder
        .rxDspConfigListener(rxDspConfigListener)
        .txDspConfigListener(txDspConfigListener)
        .rxSyncStatusListener(rxSyncStatusListener)
        .build();
    invokeOnEnter('#tx-data-textarea', onTxDataClick);
}

function rxDspConfigListener(state) {
    html('#rx-sample-rate', (state.rxSampleRate / 1000).toFixed(1));
}

function rxSyncStatusListener(state) {
    html(
        '#rx-sync-status',
        (state.isRxSyncOk ? 'OK' : 'waiting for sync...') +
        (state.isRxSyncInProgress ? ' [sync in progress]' : '')
    );
}

function txDspConfigListener(state) {
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.txSampleRate);
}

// ---------

function onTxTwoWaySyncClick() {
    transportLayer.txTwoWaySync();
}

function onSetTxSampleRateClick(txSampleRate) {
    transportLayer.setTxSampleRate(txSampleRate);
}

// -----------------------------------------------------------------------

function onTxDataClick() {
    var
        txDataTextarea = getFormFieldValue('#tx-data-textarea'),
        txData = getByteListFromAsciiString(txDataTextarea);

    transportLayer.txData(txData);
    setValue('#tx-data-textarea', '');
}

/*
function clientConnect() {
    transportLayer.clientConnect();
}

function clientDisconnect() {
    transportLayer.clientDisconnect();
}

function serverListen() {
    transportLayer.serverListen();
}

function serverDisconnect() {
    transportLayer.serverDisconnect();
}
*/
