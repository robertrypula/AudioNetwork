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
        .connectionStatus(connectionStatusListener)
        .rxByteStreamListener(rxByteStreamListener)
        .txByteStreamListener(txByteStreamListener)
        .build();
    invokeOnEnter('#tx-data-textarea', onTxDataClick);
}

function rxDspConfigListener(state) {
    html('#rx-sample-rate', (state.rxSampleRate / 1000).toFixed(1));
}

function txDspConfigListener(state) {
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.txSampleRate);
}

function rxSyncStatusListener(state) {
    html(
        '#rx-sync-status',
        (state.isRxSyncOk ? 'OK' : 'waiting for sync...') +
        (state.isRxSyncInProgress ? ' [sync in progress]' : '')
    );
}

function connectionStatusListener(state) {
    html('#socket-state', state.state);
}

function rxByteStreamListener(byteStream) {
    console.log('rxByteStreamListener', byteStream);
    html(
        '#rx-byte-stream',
        getAsciiFromByteList(byteStream.payload),
        true
    );
}

function txByteStreamListener(byteStream) {
    console.log('txByteStreamListener', byteStream);
    html(
        '#tx-byte-stream',
        getAsciiFromByteList(byteStream.payload),
        true
    );
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

    transportLayer.send(txData);
    setValue('#tx-data-textarea', '');
}

function onConnectClick() {
    transportLayer.connect();
}

function onCloseClick() {
    transportLayer.close();
}

function onListenClick() {
    transportLayer.listen();
}
