// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    physicalLayer,
    rxSymbolList = [];

function init() {
    physicalLayer = new PhysicalLayer(statusHandler);

    document.addEventListener(
        'keyup',
        function(e) {
            var digit = getDigitFromKeyCode(e.keyCode);

            if (digit !== null) {
                physicalLayer.txSymbol(100 + digit);
            }
        },
        true
    );

    onLoopbackCheckboxChange();
}

function getDigitFromKeyCode(keyCode) {
    var digit = null;

    if (keyCode >= 48 && keyCode <= 57) {
        digit = keyCode - 48;
    } else {
        if (keyCode >= 96 && keyCode <= 105) {
            digit = keyCode - 96;
        }
    }

    return digit;
}

function onLoopbackCheckboxChange() {
    physicalLayer.setLoopback(
        document.getElementById('loopback-checkbox').checked
    );
}

function refreshTxSymbolQueue() {
    var txSymbolQueue = physicalLayer.getTxSymbolQueue();

    html('#tx-symbol-queue', txSymbolQueue.join(', '));
}

function statusHandler(state) {
    if (state.isSymbolReadyToTake) {
        rxSymbolList.push(state.symbol);
    }
    updateView(state);
}

function updateView(state) {
    html('#rx-dsp-detail', state.dsp.sampleRateReceive + ' Hz');

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
                html('#rx-symbol-list', rxSymbolList.join(', '));
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
