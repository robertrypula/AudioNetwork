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
    invokeOnEnter('#tx-data-textarea', onTxDataClick);
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

function fakeReceiveOrSetStateEventListener(state, rxFrame) {        // TODO this is POC - it will be deleted
    var frameStr;

    html('#fake-state', now() + ' | ' + state + '<br/>', true);
    if (rxFrame) {
        frameStr = toHex(rxFrame.rxFrameHeader) + ' ' + rxFrame.rxFramePayload.map(function (item) { return toHex(item); }).join(' ') + ' ' + toHex(rxFrame.rxFrameChecksum);
        html('#fake-traffic', now() + ' | ' + 'RX: ' + frameStr + '<br/>', true);
    }
}

function now() {
    var now = new Date();

    return '' +
        ('0' + now.getHours()).slice(-2) + ':' +
        ('0' + now.getMinutes()).slice(-2) + ':' +
        ('0' + now.getSeconds()).slice(-2) + '.' +
        ('000' + now.getMilliseconds()).slice(-3)
    ;
}

function fakeTransmitEventListener(txFrame) {
    var frameStr = toHex(txFrame.txFrameHeader) + ' ' + txFrame.txFramePayload.map(function (item) { return toHex(item); }).join(' ') + ' ' + toHex(txFrame.txFrameChecksum);

    html('#fake-traffic', now() + ' | ' + 'TX: ' + frameStr + '<br/>', true);
}

function toHex(value) {
    var hex = value.toString(16);

    return hex.length === 1 ? '0' + hex : hex;
}

// -----------------------------------------------------------------------
// -----------------------------------------------------------------------

var
    recordedData = {},
    isRecording = false;

function rxSampleDspDetailsListener(state) {
    var rxDspConfig = transportLayer.getDataLinkLayer().getPhysicalLayer().getRxDspConfig();

    if (!isRecording) {
        return;
    }
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
