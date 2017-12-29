// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var DataLinkLayerBuilder = AudioNetwork.Rewrite.DataLinkLayer.DataLinkLayerBuilder;

var
    dataLinkLayerBuilder,
    dataLinkLayer;

function init() {
    dataLinkLayerBuilder = new DataLinkLayerBuilder();
    dataLinkLayer = dataLinkLayerBuilder
        // Physial Layer listeners
        .rxSyncStatusListener(rxSyncStatusListener)
        .rxDspConfigListener(rxDspConfigListener)
        .dspConfigListener(dspConfigListener)
        .txDspConfigListener(txDspConfigListener)
        // Data Link Layer listeners
        .rxFrameListener(rxFrameListener)
        .rxFrameCandidateListener(rxFrameCandidateListener)
        .txFrameListener(txFrameListener)
        .txFrameProgressListener(txFrameProgressListener)
        .build();
}

function log(elementId, object) {
    html('#' + elementId, JSON.stringify(object, null, 2));
}

function rxSyncStatusListener(state) {
    html(
        '#rx-sync-status',
        (state.isRxSyncOk ? 'OK' : 'waiting...') +
        (state.isRxSyncInProgress ? ' [sync]' : '')
    );
}

function rxDspConfigListener(state) {
    html('#rx-sample-rate', (state.rxSampleRate / 1000).toFixed(1));
}

function dspConfigListener(state) {
    html('#loopback', state.isLoopbackEnabled ? 'enabled' : 'disabled');
    html('#unit-time', state.unitTime.toFixed(2));
}

function txDspConfigListener(state) {
    html('#tx-sample-rate', (state.txSampleRate / 1000).toFixed(1));
}

function log(elementId, object) {
    html('#' + elementId, JSON.stringify(object, null, 2));
}

function onSetLoopbackClick(state) {
    dataLinkLayer.setLoopback(state);
}

function onSetUnitTimeClick(unitTime) {
    dataLinkLayer.getPhysicalLayer().setUnitTime(unitTime);
}

function onSetTxSampleRateClick(txSampleRate) {
    dataLinkLayer.setTxSampleRate(txSampleRate);
}

function onTxTwoWaySyncClick() {
    dataLinkLayer.txTwoWaySync();
}

function onTxClick() {
    var
        text = getFormFieldValue('#tx-textarea'),
        txFramePayload = getByteListFromAsciiString(text),
        isTxFrameCommand = false,
        txFramePayload;

    try {
        dataLinkLayer.txFrame(txFramePayload, isTxFrameCommand);
    } catch (e) {
        alert(e);
    }

    setValue('#tx-textarea', '');
}

// ------

function rxFrameListener(rxFrame) {
    log('log-rx-frame', rxFrame);
}

function rxFrameCandidateListener(rxFrameCandidate) {
    log('log-rx-frame-candidate', rxFrameCandidate);
}

function txFrameListener(txFrame) {
    log('log-tx-frame', txFrame);
}

function txFrameProgressListener(txFrameProgress) {
    log('log-tx-frame-progress', txFrameProgress);
}

