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
        .dspConfigListener(dspConfigListener)
        .rxSyncStatusListener(rxSyncStatusListener)
        .rxSampleDspDetailsListener(rxSampleDspDetailsListener)
        .build();
}

function dspConfigListener(state) {
    setActive(
        '#loopback-container',
        '#loopback-' + (state.isLoopbackEnabled ? 'enabled' : 'disabled')
    );
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

function onSetLoopbackClick(state) {
    transportLayer.setLoopback(state);
}

// -----------------------------------------------------------------------

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










// -----------------------------------------------------------------------
// -----------------------------------------------------------------------

var
    recordedData = {},
    isRecording = false;

function rxSampleDspDetailsListener(state) {
    var rxDspConfig = transportLayer.getDataLinkLayer().getPhysicalLayer().getRxDspConfig();

    recordedData.indexMin = rxDspConfig.rxSymbolMin;
    recordedData.indexMax = rxDspConfig.rxSymbolMax;
    recordedData.frequencySpacing = rxDspConfig.rxSymbolFrequencySpacing;
    recordedData.history = recordedData.history ? recordedData.history : [];
    recordedData.history.push({
        dateTime: new Date(),
        frequencyData: state.rxFrequencyData,
        indexMarker: state.rxSymbolRaw,
        rowMarker: state.isRxSymbolSamplingPoint
    });
}

function onRecordStartClick() {
    isRecording = true;
    html('#recording-status', 'Recording...');
}

function onRecordStopClick() {
    var recordedDataString, i, j, array;

    isRecording = false;
    for (i = 0; i < recordedData.history.length; i++) {
        array = [];
        for (j = 0; j < recordedData.history[i].frequencyData.length; j++) {
            array.push(parseFloat(recordedData.history[i].frequencyData[j].toFixed(1)));
        }
        recordedData.history[i].frequencyData = array;
    }
    recordedDataString = JSON.stringify(recordedData);
    recordedData = {};

    html('#recording-status', 'Recording stopped');
    setTimeout(function () {
        document.getElementById('recorded-data').value = recordedDataString;
    }, 0);
}
