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
        .txFrameListener(txFrameListener)
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
    var i, frameCandidate, hex, ascii, rxFrameCandidateHtml, alreadyExists, ioTraffixId, progress;

    for (i = 0; i < data.length; i++) {
        frameCandidate = data[i];
        ioTraffixId = 'rx-' + frameCandidate.id;

        alreadyExists = ioTraffic.alreadyExists(ioTraffixId);
        if (!alreadyExists) {
            ioTraffic.addRxItem(ioTraffixId, '');
        }

        progress = frameCandidate.rxByteReceived.length / frameCandidate.rxByteExpected;
        ioTraffic.updateProgressBar(ioTraffixId, progress);

        hex = getDataLinkFrameCandidateHex(frameCandidate.rxByteReceived, frameCandidate.rxByteExpected);
        ascii = getAsciiFromByteList(frameCandidate.rxByteReceived);
        ascii = ascii.substring(1, frameCandidate.rxByteExpected - 1);
        rxFrameCandidateHtml = hex + '<br/>' + ascii + '&nbsp;';
        ioTraffic.updateHtml(ioTraffixId, rxFrameCandidateHtml);

        if (progress === 1 && !frameCandidate.isRxFrameCandidateValid) {
            ioTraffic.addClass(ioTraffixId, 'io-traffic-error');
        }
    }
}

function rxFrameListener(data) {
    //  ioTraffic.updateProgressBar('rx-' + data.rxFrameCandidateId, 1);
    ioTraffic.addClass('rx-' + data.rxFrameCandidateId, 'io-traffic-success');
}

function txFrameListener(data) {
    ioTraffic.updateProgressBar('tx-' + data.id, 1);
    ioTraffic.addClass('tx-' + data.id, 'io-traffic-success');
}

function txFrameProgressListener(data) {
    var
        txFrameCurrent = data.txFrameCurrent,
        txFrameQueueItem,
        unitProgress,
        txFrameHtml,
        txFrameHex,
        ascii,
        id,
        i;

    for (i = 0; i < data.txFrameQueue.length; i++) {
        txFrameQueueItem = data.txFrameQueue[i];
        id = txFrameQueueItem.id;
        if (id > txFrameLastRenderedId) {
            txFrameHex = getDataLinkFrameHex(
                txFrameQueueItem.txFrameHeader,
                txFrameQueueItem.txFramePayload,
                txFrameQueueItem.txFrameChecksum
            );
            ascii = getAsciiFromByteList(txFrameQueueItem.txFramePayload);
            txFrameHtml = txFrameHex + '<br/>' + ascii + '&nbsp;';
            ioTraffic.addTxItem('tx-' + id, txFrameHtml);
            txFrameLastRenderedId = id;
        }
    }

    if (txFrameCurrent) {
        id = txFrameCurrent.id;
        unitProgress = txFrameCurrent.txSymbolTransmitted / txFrameCurrent.txSymbolId.length;
        ioTraffic.updateProgressBar('tx-' + id, unitProgress);
    }
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
    ioTraffic.forceNewRow();
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
