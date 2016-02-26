var anpl = new AudioNetworkPhysicalLayer({
    tx: {
        channel: [
            {
                baseFrequency: 1070,
                ofdmSize: 1, 
                ofdmFrequencySpacing: 100
            }
        ]
    },
    rx: {
        input: 'microphone',          // 'txLoopback', 'url'
        notificationPerSecond: 20,
        dftRange: 0.100,
        spectogramDivId: {
            elementId: 'receive-spectogram',
            fftSize: 256,
            height: 200
        },
        constellationDiagram: {
            elementId: 'constellation-diagram-{{channelIndex}}-{{ofdmIndex}}',
            pointQueueSize: 50,
            width: 200,
            height: 200
        },
        channel: [
            {
                baseFrequency: 1070, 
                ofdmSize: 1, 
                ofdmFrequencySpacing: 100 
            }
        ]
    }
});

/*
anpl.tx(
    0,
    [
        { amplitude: 1.000, duration: 0.200, phase: 0.000 }
        // ...next ofdm carriers  data
    ]
);

anpl.rx(function (channel, carrierData) {

});

anpl.setTxFrequency(0, 0, 1000.04);
anpl.getTxFrequency(0, 0);
anpl.setRxInput('');

// optional methods
// anpl.setRxDftRange(0.43);  
// anpl.setRxConstellationDiagramPointSize(0.43);  
// anpl.setRxNotificationPerSecond(25)
// anpl.rxSpectogramDisable()
// anpl.rxSpectogramEnable()
// anpl.rxConstellationDiagramDisable()
// anpl.rxConstellationDiagramEnable()

anpl.setRxFrequency(0, 0, 1000.04);
anpl.getRxFrequency(0, 0);
anpl.getSamplingFrequency();
anpl.destroy();

*/
