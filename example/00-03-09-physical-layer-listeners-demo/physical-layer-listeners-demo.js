// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
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
        rxSymbolElementList = document.querySelectorAll('#received-byte-container > span'),
        i;

    for (i = 0; i < rxSymbolElementList.length; i++) {
        rxSymbolElementList[i].classList.remove('active');
    }
    if (data.symbol) {
        document.getElementById('rx-symbol-' + data.symbol).classList.add('active');
    }
    receivedBytes.push(data.symbol ? byteToText(data.symbol - physicalLayer.getRxConfig().symbolMin) : '--');
    if (receivedBytes.length > 10) {
        receivedBytes.shift();
    }
    html('#received-byte-history', receivedBytes.join(' '));
    log('log-rx-symbol', data);
}

function rxSampleListener(data) {
    data.frequencyData = '[spectrogram array]';
    log('log-rx-sample', data);
}

function rxSyncListener(data) {
    log('log-rx-sync', data);
}

function rxConfigListener(data) {
    var symbol, container, html, byte;

    container = document.getElementById('received-byte-container');
    if (container.innerHTML === '') {
        html = '';
        for (symbol = data.symbolMin; symbol <= data.symbolMax; symbol++) {
            byte = symbol - data.symbolMin;
            html += '<span id="rx-symbol-' + symbol + '">' + byteToText(byte) +'</span>';
        }
        container.innerHTML = html;
    }
    log('log-rx-config', data);
}

function configListener(data) {
    log('log-config', data);
}

function txListener(data) {
    log('log-tx', data);
}

function txConfigListener(data) {
    var symbol, byte, htmlContent = '';

    for (symbol = data.symbolMin; symbol <= data.symbolMax; symbol++) {
        byte = symbol - data.symbolMin;
        htmlContent += '<a href="javascript:void(0)" onClick="physicalLayer.sendSymbol(' + symbol + ')">' + byteToText(byte) + '</a>';
    }
    html('#send-byte-button-container', htmlContent);
    log('log-tx-config', data);
}

function log(elementId, object) {
    html('#' + elementId, JSON.stringify(object, null, 2));
}

function byteToText(byte) {
    return (byte < 16 ? '0' : '') + byte.toString(16).toUpperCase();
}
