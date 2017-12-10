// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    dataLinkLayerBuilder,
    dataLinkLayer,
    ioTraffic,
    txFrameLastRenderedId = 0;

function init() {
    dataLinkLayerBuilder = new DataLinkLayerBuilder();
    dataLinkLayer = dataLinkLayerBuilder
        .rxFrameListener(rxFrameListener)
        .rxFrameCandidateListener(rxFrameCandidateListener)
        .txFrameProgressListener(txFrameProgressListener)
        .dspConfigListener(dspConfigListener)
        .txDspConfigListener(txDspConfigListener)
        .rxDspConfigListener(rxDspConfigListener)
        .rxSyncStatusListener(rxSyncStatusListener)
        .build();

    ioTraffic = new IoTraffic(document.getElementById('io-traffic'));
    invokeOnEnter('#tx-textarea', onTxClick);
}

// ----------------------------------

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

function rxFrameCandidateListener(data) {
    var i, rxFrameCandidate, alreadyExists, ioTraffixId;

    for (i = 0; i < data.length; i++) {
        rxFrameCandidate = data[i];
        ioTraffixId = 'rx-' + rxFrameCandidate.id;

        alreadyExists = ioTraffic.alreadyExists(ioTraffixId);
        if (!alreadyExists) {
            ioTraffic.addRxItem(ioTraffixId, '');
        }

        ioTraffic.updateProgressBar(ioTraffixId, rxFrameCandidate.unitProgress);
        ioTraffic.updateHtml(ioTraffixId, getRxFrameCandidateHtml(rxFrameCandidate));
        if (rxFrameCandidate.isFullyReceived && !rxFrameCandidate.isValid) {
            ioTraffic.addClass(ioTraffixId, 'io-traffic-error');
        }
    }
}

function rxFrameListener(data) {
    ioTraffic.addClass('rx-' + data.rxFrameCandidateId, 'io-traffic-success');
}

function txFrameProgressListener(data) {
    var
        txFrameCurrent = data.txFrameCurrent,
        txFrame = data.txFrame,
        txFrameNotYetRendered,
        txFrameQueueItem,
        id,
        i;

    for (i = 0; i < data.txFrameQueue.length; i++) {
        txFrameQueueItem = data.txFrameQueue[i];
        id = txFrameQueueItem.id;
        txFrameNotYetRendered = id > txFrameLastRenderedId;
        if (txFrameNotYetRendered) {
            ioTraffic.addTxItem('tx-' + id, getTxFrameHtml(txFrameQueueItem));
            txFrameLastRenderedId = id;
        }
    }

    if (txFrameCurrent) {
        ioTraffic.updateProgressBar('tx-' + txFrameCurrent.id, txFrameCurrent.unitProgress);
    }

    if (txFrame) {
        ioTraffic.updateProgressBar('tx-' + txFrame.id, txFrame.unitProgress);
        ioTraffic.addClass('tx-' + txFrame.id, 'io-traffic-success');
    }
}

function getRxFrameCandidateHtml(rxFrameCandidate) {
    var hex, ascii;

    hex = getDataLinkFrameCandidateHex(rxFrameCandidate.byteReceived, rxFrameCandidate.byteExpected);
    ascii = getAsciiFromByteList(rxFrameCandidate.byteReceived);
    ascii = ascii.substring(1, rxFrameCandidate.byteExpected - 1); // get payload only

    return hex + '<br/>' + ascii + '&nbsp;';
}

function getTxFrameHtml(txFrameQueueItem) {
    var txFrameHex, ascii;

    txFrameHex = getDataLinkFrameHex(
        txFrameQueueItem.header,
        txFrameQueueItem.payload,
        txFrameQueueItem.checksum
    );
    ascii = getAsciiFromByteList(txFrameQueueItem.payload);

    return txFrameHex + '<br/>' + ascii + '&nbsp;';
}

// ----------------------------------

function onSetLoopbackClick(state) {
    dataLinkLayer.setLoopback(state);
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
        byteList = getByteListFromAsciiString(text),
        txFramePayloadList = getTxFramePayloadListFromByteList(byteList),
        isTxFrameCommand = false,
        txFramePayload,
        i;

    for (i = 0; i < txFramePayloadList.length; i++) {
        txFramePayload = txFramePayloadList[i];
        dataLinkLayer.txFrame(txFramePayload, isTxFrameCommand);
    }
    setValue('#tx-textarea', '');
    ioTraffic.forceNewRow();         // TODO probably not needed
}

function getTxFramePayloadListFromByteList(byteList) {
    var
        limit = dataLinkLayer.getFramePayloadLengthLimit(),
        txFramePayloadList = [],
        payloadCompleted,
        txFramePayload,
        i;

    txFramePayload = [];
    for (i = 0; i < byteList.length; i++) {
        txFramePayload.push(byteList[i]);

        payloadCompleted =
            (i % limit) === (limit - 1) ||
            i === (byteList.length - 1);

        if (payloadCompleted) {
            txFramePayloadList.push(txFramePayload);
            txFramePayload = [];
        }
    }

    return txFramePayloadList;
}
