var anpl;

function onLoad() {
    anpl = new AudioNetworkPhysicalLayer({
        tx: {
        },
        rx: {
            notificationPerSecond: 25, // default: 20
            dftTimeSpan: 0.2, // default: 0.1
            spectrum: {
                //elementId: 'rx-spectrum',
                height: 150
            },
            constellationDiagram: {
                //elementId: 'rx-constellation-diagram-{{ channelIndex }}-{{ ofdmIndex }}',
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

    frequencyUpdate(true, 'tx', 0, 0);
    frequencyUpdate(true, 'tx', 1, 0);
    frequencyUpdate(false, 'tx', 0, 0);
    frequencyUpdate(false, 'tx', 1, 0);

    frequencyUpdate(true, 'rx', 0, 0);
    frequencyUpdate(true, 'rx', 1, 0);
    frequencyUpdate(false, 'rx', 0, 0);
    frequencyUpdate(false, 'rx', 1, 0);
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

function transmit(channelIndex, offset) {
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
        sequeceData = document.getElementById('tx-sequence-data-' + channelIndex + '-0').value + '',
        pskSize = parseInt(document.getElementById('tx-sequence-psk-size-' + channelIndex + '-0').value),
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

function frequencyUpdate(isLabel, rxTx, channelIndex, ofdmIndex) {
    var elementId, element, frequency;

    elementId = rxTx + '-frequency-' + (isLabel ? '' : 'change-') + channelIndex + '-' + ofdmIndex;
    element = document.getElementById(elementId);

    frequency = (
        rxTx === 'tx' ?
        anpl.getTxFrequency(channelIndex, ofdmIndex) :
        anpl.getRxFrequency(channelIndex, ofdmIndex)
    );
    if (isLabel) {
        element.innerHTML = frequency;
    } else {
        element.value = frequency;
    }
}

function frequencyChange(rxTx, channelIndex, ofdmIndex) {
    var elementId, element;

    elementId = rxTx + '-frequency-change-' + channelIndex + '-' + ofdmIndex;
    element = document.getElementById(elementId);

    if (rxTx === 'tx') {
        anpl.setTxFrequency(channelIndex, ofdmIndex, parseFloat(element.value));
    } else {
        anpl.setRxFrequency(channelIndex, ofdmIndex, parseFloat(element.value));
    }

    frequencyUpdate(true, rxTx, channelIndex, ofdmIndex);
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
