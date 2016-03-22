'use strict';

var anpl = null;

function onLoad() {
    reinitialize();
}

function reinitialize() {
    var
        txChannel = [],
        rxChannel = [],
        txRx = [],
        dftTimeSpan,
        notificationPerSecond,
        rxSpectrumVisible, rxConstellationDiagramVisible,
        value, channelDataList, channelData, i, j;

    txRx.push({
        id: 'tx',
        data: txChannel
    });
    txRx.push({
        id: 'rx',
        data: rxChannel
    });

    for (i = 0; i < txRx.length; i++) {
        value = getStrById(txRx[i].id + '-channel-config');
        channelDataList = value === '' ? [] : (value).split(' ');
        for (j = 0; j < channelDataList.length; j++) {
            channelData = channelDataList[j].split('-');
            txRx[i].data.push({
                baseFrequency: parseFloat(channelData[0]),
                ofdmSize: parseInt(channelData[1]),
                ofdmFrequencySpacing: parseFloat(channelData[2])
            });
        }
    }

    rxSpectrumVisible = !!document.getElementById('rx-spectrum-visible').checked;
    rxConstellationDiagramVisible = !!document.getElementById('rx-constellation-diagram-visible').checked;
    dftTimeSpan = getFloatById('rx-dft-time-span');
    notificationPerSecond = getIntById('rx-notification-per-second');

    destroy();

    // we need to wait because canvas related objects are cleaned on next drawing frame that is asynchronous
    setTimeout(function () {
        receivePacketHistory = [];
        initialize(txChannel, rxChannel, rxSpectrumVisible, rxConstellationDiagramVisible, notificationPerSecond, dftTimeSpan);
    }, 500);
}

function initialize(txChannel, rxChannel, rxSpectrumVisible, rxConstellationDiagramVisible, notificationPerSecond, dftTimeSpan) {
    generateHtml(txChannel, rxChannel);
    anpl = new AudioNetworkPhysicalLayer({
        tx: {
            channel: txChannel
        },
        rx: {
            channel: rxChannel,
            notificationPerSecond: notificationPerSecond, // default: 20
            dftTimeSpan: dftTimeSpan / 1000, // default: 0.1
            spectrum: {
                elementId: rxSpectrumVisible ? 'rx-spectrum' : null,
                height: 150,
                color: {
                    axis: '#999',
                    data: '#FAA61A'
                }
            },
            constellationDiagram: {
                color: {
                    axis: '#43B581'
                },
                elementId: (
                    rxConstellationDiagramVisible ?
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
    initializeHtml();
}


function destroy() {
    if (anpl) {
        anpl.destroy();
        document.getElementById('tx-channel-container').innerHTML = '';
        document.getElementById('rx-channel-container').innerHTML = '';
        anpl = null;
    }
}

function frequencyUpdate(rxTx, channelIndex, ofdmIndex) {
    var elementId, newFrequency;

    elementId = rxTx + '-frequency-input-' + channelIndex + '-' + ofdmIndex;
    newFrequency = getFloatById(elementId);
    
    if (rxTx === 'tx') {
        anpl.setTxFrequency(channelIndex, ofdmIndex, newFrequency);
    } else {
        anpl.setRxFrequency(channelIndex, ofdmIndex, newFrequency);
    }

    uiRefresh();
}

function phaseCorrectionUpdate(rxTx, channelIndex, ofdmIndex) {
    var elementId, newFrequency;

    elementId = rxTx + '-phase-correction-input-' + channelIndex + '-' + ofdmIndex;
    newFrequency = getFloatById(elementId);
    
    if (rxTx === 'tx') {
        anpl.setTxPhaseCorrection(channelIndex, ofdmIndex, newFrequency);
    } else {
        anpl.setRxPhaseCorrection(channelIndex, ofdmIndex, newFrequency);
    }

    uiRefresh();
}

function rxInput(type) {
    var refresh = true;

    switch (type) {
        case 'mic':
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.MICROPHONE);
            break;
        case 'tx':
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.TX);
            break;
        case 'rec':
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.RECORDED_AUDIO);
            break;
        default:
            refresh = false;
    }

    if (refresh) {
        uiRefresh();
    }
}

function loadRecordedAudio() {
    anpl.loadRecordedAudio(
        getStrById('recorded-audio-url'),
        function () {
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.RECORDED_AUDIO);
            anpl.outputRecordedAudioEnable();
            uiRefresh();
        },
        function () {
            alert('Error');
        }
    );
}

function output(type, state) {
    var refresh = true;

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
        default:
            refresh = false;
    }

    if (refresh) {
        uiRefresh();
    }
}
