// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    physicalLayer,
    physicalLayerState,
    rxSymbolList,
    rxAsciiList;

function init() {
    physicalLayer = new PhysicalLayer(statusHandler);
    rxSymbolList = new Buffer(20);
    rxAsciiList = new Buffer(20);

    document.getElementById('tx-keycode-field').addEventListener(
        'keydown',
        function(e) {
            var
                keyCode = e.key.length === 1 ? e.key.charCodeAt(0) : 0,
                isPrintableAscii = keyCode >= ' '.charCodeAt(0) && keyCode <= '~'.charCodeAt(0);

            e.preventDefault();
            e.stopPropagation();

            if (isPrintableAscii && physicalLayerState) {
                physicalLayer.txSymbol(physicalLayerState.band.symbolMin + keyCode);
            }
        },
        true
    );

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    physicalLayer.setLoopback(
        document.getElementById('loopback-checkbox').checked
    );
}

function refreshTxSymbolQueue() {
    var txSymbolQueue = physicalLayer.getTxSymbolQueue();

    html('#tx-symbol-queue', txSymbolQueue.join(' '));
}

function statusHandler(state) {
    var keyCode, isPrintableAscii;

    if (state.isSymbolReadyToTake) {
        rxSymbolList.pushEvenIfFull(state.symbol);
        keyCode = state.symbol - state.band.symbolMin;
        isPrintableAscii = keyCode >= ' '.charCodeAt(0) && keyCode <= '~'.charCodeAt(0);
        rxAsciiList.pushEvenIfFull(
            isPrintableAscii ? String.fromCharCode(keyCode) : '�'
        );
    }
    updateView(state);
    physicalLayerState = state;
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
        if (state.isConnected) {
            html('#rx-log-connect', 'Connected!');
        } else {
            html('#rx-log-connect', 'not connected');
        }
    }

    if (state.isConnected) {
        if (state.isSymbolSamplingPoint) {
            if (state.isSymbolReadyToTake) {
                html('#rx-symbol-synchronized', state.symbol + ' (' + state.symbolDetail.signalDecibel.toFixed(2) + ' dB)');
                html('#rx-symbol-list', rxSymbolList.getAll().join(' ') + '<br/>' + rxAsciiList.getAll().join(''));
            } else {
                html('#rx-symbol-synchronized', 'idle');
            }
        }
    } else {
        html('#rx-symbol-synchronized', '');
    }

    refreshTxSymbolQueue();
}

function onConnectClick(sampleRate) {
    physicalLayer.txConnect(sampleRate);
    refreshTxSymbolQueue();
}

function onSymbolClick(symbol) {
    physicalLayer.txSymbol(symbol);
    refreshTxSymbolQueue();
}
