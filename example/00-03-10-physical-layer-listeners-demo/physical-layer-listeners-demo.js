// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    BYTE_HISTORY_MAX = 8,
    receivedByteContainerRendered = false,
    physicalLayerBuilder,
    receivedBytes = [],
    physicalLayer;

function init() {
    physicalLayerBuilder = new PhysicalLayerBuilder();
    physicalLayer = physicalLayerBuilder
        .rxSymbolListener(rxSymbolListener)
        .rxSampleListener(rxSampleListener)
        .rxSyncListener(rxSyncListener)
        .rxConfigListener(rxConfigListener)
        .configListener(configListener)
        .txListener(txListener)
        .txConfigListener(txConfigListener)
        .build();
}

function rxSymbolListener(data) {
    var
        rxConfig = physicalLayer.getRxConfig(),
        byte,
        byteText;

    byte = data.symbol
        ? data.symbol - rxConfig.symbolMin
        : null;
    byteText = byte !== null ? byteToText(byte) : '---';
    receivedBytes.push(byteText);
    if (receivedBytes.length > BYTE_HISTORY_MAX) {
        receivedBytes.shift();
    }

    html('#received-byte-history', receivedBytes.join(' '));
    html('#rx-symbol', data.symbol ? data.symbol : 'idle');
    html('#rx-byte', byteText);
    setActive('#received-byte-container', '#rx-symbol-' + (data.symbol ? data.symbol : ''));
    log('log-rx-symbol', data);
}

function rxSampleListener(data) {
    data.frequencyData = '[spectrogram array]';
    html('#sync', data.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', data.isSyncInProgress ? '[sync in progress]' : '');
    log('log-rx-sample', data);
}

function rxSyncListener(data) {
    log('log-rx-sync', data);
}

function rxConfigListener(data) {
    var symbol, htmlContent, byte;

    if (!receivedByteContainerRendered) {
        htmlContent = '';
        for (symbol = data.symbolMin; symbol <= data.symbolMax; symbol++) {
            byte = symbol - data.symbolMin;
            htmlContent +=
                '<span id="rx-symbol-' + symbol + '">' +
                byteToText(byte) +
                '</span>';
        }
        html('#received-byte-container', htmlContent);
        receivedByteContainerRendered = true;
    }
    html('#rx-sample-rate', (data.sampleRate / 1000).toFixed(1));
    log('log-rx-config', data);
}

function configListener(data) {
    html('#loopback', data.isLoopbackEnabled ? 'enabled' : 'disabled');
    log('log-config', data);
}

function txListener(data) {
    log('log-tx', data);
}

function txConfigListener(data) {
    var symbol, byte, htmlContent = '';

    for (symbol = data.symbolMin; symbol <= data.symbolMax; symbol++) {
        byte = symbol - data.symbolMin;
        htmlContent +=
            '<a href="javascript:void(0)" onClick="onSendByteClick(' + byte + ')">' +
            byteToText(byte) +
            '</a>';
    }
    html('#send-byte-button-container', htmlContent);
    html('#tx-sample-rate', (data.sampleRate / 1000).toFixed(1));
    html('#amplitude', (data.amplitude * 100).toFixed(0));
    log('log-tx-config', data);
}

function log(elementId, object) {
    html('#' + elementId, JSON.stringify(object, null, 2));
}

function byteToText(byte) {
    return (byte < 16 ? '0' : '') + byte.toString(16).toUpperCase();
}

function onSendByteClick(byte) {
    var
        txConfig = physicalLayer.getTxConfig(),
        symbol = txConfig.symbolMin + byte;

    physicalLayer.sendSymbol(symbol);
}
