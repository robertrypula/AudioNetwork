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
}

function destroy() {
    anpl.destroy();
}

function receive(channelIndex, carrierData) {
    var i, elementPower, elementPhase;

    for (i = 0; i < carrierData.length; i++) {
        elementPower = document.getElementById('rx-info-power-' + channelIndex + '-' + i);
        elementPhase = document.getElementById('rx-info-phase-' + channelIndex + '-' + i);

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
