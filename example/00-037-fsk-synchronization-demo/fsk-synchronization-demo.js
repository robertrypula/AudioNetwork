// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    /*
    48.0 kHz -> skipping 5 -> 29.296875 Hz      - 7 617 Hz
    44.1 kHz -> skipping 5 -> 26.91650390625 Hz - 6 998 Hz

    48.0 kHz -> skipping 3 -> 17.578125 Hz      - 4 570 Hz
    44.1 kHz -> skipping 3 -> 16.14990234375 Hz - 4 199 Hz
     */

    physicalLayer,
    rxSpectrogram,
    rxSymbolList = [],
    txSampleRateWidget;

function init() {
    physicalLayer = new PhysicalLayer(statusHandler);

    rxSpectrogram = new Spectrogram(document.getElementById('rx-spectrogram'));
    txSampleRateWidget = new EditableFloatWidget(
        document.getElementById('tx-sample-rate'),
        physicalLayer.getTxSampleRate(), 5, 0,
        onTxSampleRateWidgetChange
    );
    document.addEventListener('keyup', function(e) {
        var digit = null;

        if (e.keyCode >= 48 && e.keyCode <= 57) {
            digit = e.keyCode - 48;
        } else {
            if (e.keyCode >= 96 && e.keyCode <= 105) {
                digit = e.keyCode - 96;
            }
        }

        if (digit !== null) {
            physicalLayer.txSymbol(100 + digit);
        }
    }, true);

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    physicalLayer.setLoopback(document.getElementById('loopback-checkbox').checked);
}

function onTxSampleRateWidgetChange() {
    physicalLayer.setTxSampleRate(txSampleRateWidget.getValue());
}

function refreshTxSymbolQueue() {
    var txSymbolQueue = physicalLayer.getTxSymbolQueue();

    html('#tx-symbol-queue', txSymbolQueue.join(', '));
}

function refreshRxSymbolList() {
    html('#rx-symbol-list', rxSymbolList.join(', '));
}

function statusHandler(state) {
    if (state.isSymbolSamplingPoint) {
        rxSymbolList.push(state.symbol);
    }
    rxUpdateView(state);
}

function rxUpdateView(state) {
    var cd;

    html('#rx-sample-rate', state.dsp.sampleRateReceive);

    if (state.isConnectionInProgress) {
        html('#rx-log-connect', 'connecting...');
    } else {
        if (state.isConnected) {
            cd = state.connectionDetail;
            html(
                '#rx-log-connect',
                'Connected!<br/>' +
                '- offset ' + cd.offset + '<br/>' +
                '- signal ' + cd.signalDecibel.toFixed(2) + ' dB' + '<br/>' +
                '- noise ' + cd.noiseDecibel.toFixed(2) + ' dB' + '<br/>' +
                '- SNR ' + cd.signalToNoiseRatio.toFixed(2) + ' dB' + '<br/>' +
                '- correlation ' + cd.correlationValue + '/' + cd.correlationValueMax + '<br/>' +
                '- threshold ' + cd.signalThresholdDecibel.toFixed() + ' dB'
            );
        } else {
            html('#rx-log-connect', 'not connected');
        }
    }

    if (document.getElementById('rx-active').checked) {
        rxSpectrogram.add(
            state.band.frequencyData,
            document.getElementById('loudest-marker').checked ? state.band.frequencyDataLoudestIndex : -1,
            state.band.indexMin,
            1,
            state.isSymbolAboveThreshold
        );
    }

    if (state.isConnected) {
        if (state.isSymbolSamplingPoint) {
            if (state.isSymbolAboveThreshold) {
                html('#rx-symbol-synchronized', state.symbol + ' (' + state.symbolDetail.signalDecibel.toFixed(2) + ' dB)');
                refreshRxSymbolList();
            } else {
                html('#rx-symbol-synchronized', 'idle');
            }
        }
    } else {
        html('#rx-symbol-synchronized', '');
    }

    html('#rx-symbol', state.symbol);
    html(
        '#rx-symbol-detail',
        state.offset + '/' + state.sampleNumber + ', ' +
        state.symbolDetail.frequency.toFixed(2) + ' Hz, ' +
        state.symbolDetail.signalDecibel.toFixed(2) + ' dB'
    );
    html(
        '#rx-log',
        'min: ' + state.band.indexMin + ' (' + state.band.frequencyMin.toFixed(2) + ' Hz)<br/>' +
        'max: ' + state.band.indexMax + ' (' + state.band.frequencyMax.toFixed(2) + ' Hz)<br/>' +
        'range: ' + state.band.indexRange + '<br/>'
    );

    refreshTxSymbolQueue();
}

function onConnectClick(sampleRate) {
    txSampleRateWidget.setValue(sampleRate);
    physicalLayer.txConnect(sampleRate);
    refreshTxSymbolQueue();
}

function onSymbolClick(symbol) {
    physicalLayer.txSymbol(symbol);
    refreshTxSymbolQueue();
}

// --------------------------------------------------------------------

