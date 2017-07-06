// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    BUFFER_SIZE = 20,
    ASCII_NULL = 0x00,
    SYMBOL_ZERO_PADDING = 3,
    UNICODE_UNKNOWN = '�',
    physicalLayer,
    physicalLayerState,
    rxSymbolList,
    rxAsciiList;

function init() {
    physicalLayer = new PhysicalLayer(statusHandler);
    rxSymbolList = new Buffer(BUFFER_SIZE);
    rxAsciiList = new Buffer(BUFFER_SIZE);

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    physicalLayer.setLoopback(
        document.getElementById('loopback-checkbox').checked
    );
}

function statusHandler(state) {
    var charCode, char;

    if (state.isSymbolReadyToTake) {
        rxSymbolList.pushEvenIfFull(state.symbol);
        charCode = state.symbol - state.band.symbolMin;
        char = String.fromCharCode(charCode);
        rxAsciiList.pushEvenIfFull(
            isPrintableAscii(char) ? char : UNICODE_UNKNOWN
        );
    }
    updateView(state);
    physicalLayerState = state;
}

function refreshTxSymbolQueue() {
    var txSymbolQueue = physicalLayer.getTxSymbolQueue();

    html('#tx-symbol-queue', getStringFromSymbolList(txSymbolQueue));
}

function updateView(state) {
    html(
        '#rx-general-info',
        'Sample rate: ' + state.dsp.sampleRateReceive + '&nbsp;Hz<br/>' +
        'Symbol range: <' + state.band.symbolMin + ',&nbsp;' + state.band.symbolMax + '>'
    );

    if (state.isConnectionInProgress) {
        html('#rx-log-connect', 'connecting...');
    } else {
        html('#rx-log-connect', state.isConnected ? 'Connected!' : 'not connected');
    }

    if (state.isConnected) {
        if (state.isSymbolSamplingPoint) {
            if (state.isSymbolReadyToTake) {
                html('#rx-symbol-synchronized', state.symbol + ' (' + state.symbolDetail.signalDecibel.toFixed(2) + ' dB)');
                html('#rx-symbol-list', getStringFromSymbolList(rxSymbolList.getAll()) + '<br/>' + rxAsciiList.getAll().join(''));
            } else {
                html('#rx-symbol-synchronized', 'idle');
            }
        }
    } else {
        html('#rx-symbol-synchronized', '&nbsp;');
    }

    refreshTxSymbolQueue();
}

function onConnectClick(sampleRate) {
    physicalLayer.txConnect(sampleRate);
    refreshTxSymbolQueue();
}

// ----------------------------------

function onSendSymbolClick() {
    var symbol = document.getElementById('tx-symbol-field').value;

    try {
        physicalLayer.txSymbol(symbol);
    } catch (e) {
        alert(e);
    }

    refreshTxSymbolQueue();
}

function onSendTextClick() {
    var
        text = document.getElementById('tx-text-field').value,
        charCode,
        symbol,
        i;

    for (i = 0; i < text.length; i++) {
        charCode = isPrintableAscii(text[i]) ? text.charCodeAt(i) : ASCII_NULL;
        symbol = physicalLayerState.band.symbolMin + charCode;
        physicalLayer.txSymbol(symbol);
    }

    refreshTxSymbolQueue();
}

// ----------------------------------

function isPrintableAscii(char) {
    return char >= ' ' && char <= '~';
}

function pad(num, size) {
    var s = '000000000' + num;

    return s.substr(s.length - size);
}

function getStringFromSymbolList(symbolList) {
    var i, tmp, formatted = [];

    for (i = 0; i < symbolList.length; i++) {
        tmp = pad(symbolList[i], SYMBOL_ZERO_PADDING);
        formatted.push(tmp);
    }

    return formatted.join(' ');
}
