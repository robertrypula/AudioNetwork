var anpl;

function onLoad() {
    anpl = new AudioNetworkPhysicalLayer({
        rx: {
            notificationPerSecond: 20,
            spectrum: {
                elementId: 'rx-spectrum',
                height: 150
            },
            constellationDiagram: {
                elementId: 'rx-constellation-diagram-{{ channelIndex }}-{{ ofdmIndex }}',
                width: 128,
                height: 128
            }
        }
    });

    anpl.rx(receive);
    document.getElementById('sample-rate').innerHTML = anpl.getSampleRate();


    frequencyUpdate(true, 'tx', 0, 0);
    frequencyUpdate(true, 'tx', 1, 0);
    frequencyUpdate(false, 'tx', 0, 0);
    frequencyUpdate(false, 'tx', 1, 0);
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
        symbolDuration = parseFloat(document.getElementById('symbol-duration').value),
        data = []
    ;

    data.push({
        duration: symbolDuration / 1000,
        phase: 0 + offset
    });
    anpl.tx(channelIndex, data);
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

    console.log(rxTx, element.value);
}

/*

anpl.setTxFrequency(0, 0, 1000.04);
anpl.getTxFrequency(0, 0);
anpl.setRxInput('');

anpl.setRxFrequency(0, 0, 1000.04);
anpl.getRxFrequency(0, 0);

// optional methods
// anpl.setRxDftTimeSpan(0.43);
// anpl.setRxConstellationDiagramPointSize(0.43);
// anpl.setRxNotificationPerSecond(25)
// anpl.rxSpectrumDisable()
// anpl.rxSpectrumEnable()
// anpl.rxConstellationDiagramDisable()
// anpl.rxConstellationDiagramEnable()



*/
