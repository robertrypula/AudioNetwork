// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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
        .rxSegmentListener(rxSegmentListener)
        .txSegmentListener(txSegmentListener)
        .build();
    invokeOnEnter('#tx-data-textarea', onTxDataClick);
}

/*
rxDataChunkListener
{
    id: 23,
    rxSegmentId: [12]
    txSegmentId: [12, 32,],
    rxDataChunkPayload: []
}

txDataProgressListener
{
    id;
    txDataPayload: []
    txDataChunkId: []
    txDataChunkTransmitted: 43
}
 */

function rxDspConfigListener(state) {
    html('#rx-sample-rate', (state.rxSampleRate / 1000).toFixed(1));
}

function txDspConfigListener(state) {
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.txSampleRate);
}

function rxSyncStatusListener(state) {
    html(
        '#rx-sync-status',
        (state.isRxSyncOk ? 'OK' : 'waiting...') +
        (state.isRxSyncInProgress ? ' [sync]' : '')
    );
}

function rxSegmentListener(rxSegment) {
    console.log(rxSegment);
}

function txSegmentListener(txSegment) {
    console.log(txSegment);
}

function connectionStatusListener(state) {
    html('#socket-state', state.state);
    html('#socket-real-tcp-state', state.realTcpState);
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
