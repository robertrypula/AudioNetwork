var anpl;

function onLoad() {
    anpl = new AudioNetworkPhysicalLayer({
        tx: {
            channel: [
                {}
            ]
        },
        rx: {
            channel: [
                {}
            ],
            notificationPerSecond: 25, // default: 20
            dftTimeSpan: 0.2, // default: 0.1
            spectrum: {
                elementId: 'rx-spectrum',
                height: 150
            },
            constellationDiagram: {
                elementId: 'rx-constellation-diagram-{{ channelIndex }}-{{ ofdmIndex }}',
                width: 140,
                height: 140,
                historyPointSize: 25 // default: 40
            }
        }
    });

    anpl.rx(receive);
    document.getElementById('sample-rate').innerHTML = anpl.getSampleRate();
    document.getElementById('tx-buffer-size').innerHTML = anpl.getTxBufferSize();
    document.getElementById('rx-buffer-size').innerHTML = anpl.getRxBufferSize();

    uiRefresh('frequency', true, 'tx', 0, 0);
    uiRefresh('frequency', false, 'tx', 0, 0);
    uiRefresh('frequency', true, 'rx', 0, 0);
    uiRefresh('frequency', false, 'rx', 0, 0);

    uiRefresh('phase-correction', true, 'tx', 0, 0);
    uiRefresh('phase-correction', false, 'tx', 0, 0);
    uiRefresh('phase-correction', true, 'rx', 0, 0);
    uiRefresh('phase-correction', false, 'rx', 0, 0);
}

function destroy() {
    anpl.destroy();
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
            phase: 0 + (parseInt(s[i]) % pskSize) / pskSize
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
