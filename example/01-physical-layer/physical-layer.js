var anpl = null;

function onLoad() {
    reinitialize();
}

function reinitialize() {
    var txChannel, rxChannel, channelData, i;

    channelData = (document.getElementById('tx-channel').value).split(' ');
    txChannel = [];
    for (i = 0; i < channelData.length; i++) {
        txChannel.push({
            ofdmSize: parseInt(channelData[i])
        });
    }

    channelData = (document.getElementById('rx-channel').value).split(' ');
    rxChannel = [];
    for (i = 0; i < channelData.length; i++) {
        rxChannel.push({
            ofdmSize: parseInt(channelData[i])
        });
    }

    initialize(txChannel, rxChannel, false, false);
}

function initialize(txChannel, rxChannel, showSpectrum, showConstellationDiagram) {
    destroy();
    generateHtml(txChannel, rxChannel);
    anpl = new AudioNetworkPhysicalLayer({
        tx: {
            channel: txChannel
        },
        rx: {
            channel: rxChannel,
            notificationPerSecond: 25, // default: 20
            dftTimeSpan: 0.2, // default: 0.1
            spectrum: {
                elementId: showSpectrum ? 'rx-spectrum' : null,
                height: 150
            },
            constellationDiagram: {
                elementId: (
                    showConstellationDiagram ?
                    'rx-constellation-diagram-{{ channelIndex }}-{{ ofdmIndex }}' :
                    null
                ),
                width: 140,
                height: 140,
                historyPointSize: 25 // default: 20
            }
        }
    });

    anpl.rx(receive);
    document.getElementById('sample-rate').innerHTML = anpl.getSampleRate();
    document.getElementById('tx-buffer-size').innerHTML = anpl.getTxBufferSize();
    document.getElementById('rx-buffer-size').innerHTML = anpl.getRxBufferSize();
    initializeHtml(txChannel, rxChannel);
}

function generateHtml(tx, rx) {
    generateHtmlForChannel(tx, 'tx');
    generateHtmlForChannel(rx, 'rx');
}

function generateHtmlForChannel(channel, id) {
    var i, j, html, element;

    for (i = 0; i < channel.length; i++) {
        html = document.getElementById('template-' + id + '-channel').innerHTML;
        html = html.replace(/\[\[ channelIndex ]]/g, i + '');
        element = document.getElementById(id + '-channel-container');
        if (i === 0) {
            element.innerHTML = '';
        }
        element.innerHTML = element.innerHTML + html;
        for (j = 0; j < channel[i].ofdmSize; j++) {
            html = document.getElementById('template-' + id + '-channel-ofdm').innerHTML;
            html = html.replace(/\[\[ channelIndex ]]/g, i + '');
            html = html.replace(/\[\[ ofdmIndex ]]/g, j + '');
            element = document.getElementById(id + '-channel-' + i + '-ofdm-container');
            element.innerHTML = element.innerHTML + html;
        }
    }
}

function initializeHtml(tx, rx) {
    var fieldType, i;

    fieldType = [
        'frequency',
        'phase-correction'
    ];
    for (i = 0; i < fieldType.length; i++) {
        initializeHtmlForChannel(tx, 'tx', fieldType[i]);
        initializeHtmlForChannel(rx, 'rx', fieldType[i]);
    }

}

function initializeHtmlForChannel(channel, id, fieldType) {
    var i, j;

    for (i = 0; i < channel.length; i++) {
        for (j = 0; j < channel[i].ofdmSize; j++) {
            uiRefresh(fieldType, true, id, i, j);
            uiRefresh(fieldType, false, id, i, j);
        }
    }
}

function destroy() {
    if (anpl) {
        anpl.destroy();
        anpl = null;
    }
}

function receive(channelIndex, carrierData) {
    var i, elementPower, elementPhase;

    for (i = 0; i < carrierData.length; i++) {
        elementPower = document.getElementById('rx-power-' + channelIndex + '-' + i);
        elementPhase = document.getElementById('rx-phase-' + channelIndex + '-' + i);

        elementPower.innerHTML = Math.round(carrierData[i].powerDecibel);
        elementPhase.innerHTML = Math.round(carrierData[i].phase * 360);
    }
}

function transmit(channelIndex, ofdmIndex, offset) {
    var
        symbolDuration = parseFloat(document.getElementById('symbol-duration').value) / 1000,
        data = []
    ;

    data.push({
        duration: symbolDuration,
        phase: 0 + offset
    });
    anpl.tx(channelIndex, data);
}

function transmitSequence(channelIndex) {
    var
        symbolDuration = parseFloat(document.getElementById('symbol-duration').value) / 1000,
        guardInterval = parseFloat(document.getElementById('guard-interval').value) / 1000,
        sequeceData = document.getElementById('tx-sequence-data-' + channelIndex).value + '',
        pskSize = parseInt(document.getElementById('tx-sequence-psk-size-' + channelIndex).value),
        s = sequeceData.split(' '),
        data,
        i
    ;

    for (i = 0; i < s.length; i++) {
        data = [];
        data.push({
            duration: symbolDuration,
            phase: (parseInt(s[i]) % pskSize) / pskSize
        });
        anpl.tx(channelIndex, data);

        data = [];
        data.push({
            duration: guardInterval,
            amplitude: 0
        });
        anpl.tx(channelIndex, data);
    }
}

function uiRefresh(type, isLabel, rxTx, channelIndex, ofdmIndex) {
    var elementId, element, value;

    elementId = rxTx + '-' + type + '-' + (isLabel ? 'label-' : 'input-') + channelIndex + '-' + ofdmIndex;
    element = document.getElementById(elementId);

    switch (type) {
        case 'frequency':
            value = (
                rxTx === 'tx' ?
                anpl.getTxFrequency(channelIndex, ofdmIndex) :
                anpl.getRxFrequency(channelIndex, ofdmIndex)
            );
            break;
        case 'phase-correction':
            value = (
                rxTx === 'tx' ?
                anpl.getTxPhaseCorrection(channelIndex, ofdmIndex) :
                anpl.getRxPhaseCorrection(channelIndex, ofdmIndex)
            );
            break;
    }
    
    element[isLabel ? 'innerHTML' : 'value'] = value;
}

function frequencyUpdate(rxTx, channelIndex, ofdmIndex) {
    var elementId, newFrequency;

    elementId = rxTx + '-frequency-input-' + channelIndex + '-' + ofdmIndex;
    newFrequency = parseFloat(document.getElementById(elementId).value);
    
    if (rxTx === 'tx') {
        anpl.setTxFrequency(channelIndex, ofdmIndex, newFrequency);
    } else {
        anpl.setRxFrequency(channelIndex, ofdmIndex, newFrequency);
    }

    uiRefresh('frequency', true, rxTx, channelIndex, ofdmIndex);
}

function phaseCorrectionUpdate(rxTx, channelIndex, ofdmIndex) {
    var elementId, newFrequency;

    elementId = rxTx + '-phase-correction-input-' + channelIndex + '-' + ofdmIndex;
    newFrequency = parseFloat(document.getElementById(elementId).value);
    
    if (rxTx === 'tx') {
        anpl.setTxPhaseCorrection(channelIndex, ofdmIndex, newFrequency);
    } else {
        anpl.setRxPhaseCorrection(channelIndex, ofdmIndex, newFrequency);
    }

    uiRefresh('phase-correction', true, rxTx, channelIndex, ofdmIndex);
}

function rxInput(type) {
    switch (type) {
        case 'mic':
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.MICROPHONE);
            break;
        case 'rxLoop':
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.TX);
            break;
        case 'rec':
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.RECORDED_AUDIO);
            break;
    }
}

function loadRecordedAudio() {
    anpl.loadRecordedAudio(
        document.getElementById('recorded-audio-url').value,
        function () {
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.RECORDED_AUDIO);
        },
        function () {
            alert('Error');
        }
    );
}

function output(type, state) {
    switch (type) {
        case 'tx':
            if (state) {
                anpl.outputTxEnable();
            } else {
                anpl.outputTxDisable();
            }
            break;
        case 'mic':
            if (state) {
                anpl.outputMicrophoneEnable();
            } else {
                anpl.outputMicrophoneDisable();
            }
            break;
        case 'rec':
            if (state) {
                anpl.outputRecordedAudioEnable();
            } else {
                anpl.outputRecordedAudioDisable();
            }
            break;
    }
}
