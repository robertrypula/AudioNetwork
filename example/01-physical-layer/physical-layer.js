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
        value = document.getElementById(txRx[i].id + '-channel').value;
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
    dftTimeSpan = parseFloat(document.getElementById('rx-dft-time-span').value);

    destroy();

    // we need to wait because canvas related objects are cleaned on next drawing frame that is asynchronous
    setTimeout(function () {
        initialize(txChannel, rxChannel, rxSpectrumVisible, rxConstellationDiagramVisible, dftTimeSpan);
    }, 500);
}

function initialize(txChannel, rxChannel, rxSpectrumVisible, rxConstellationDiagramVisible, dftTimeSpan) {
    generateHtml(txChannel, rxChannel);
    anpl = new AudioNetworkPhysicalLayer({
        tx: {
            channel: txChannel
        },
        rx: {
            channel: rxChannel,
            notificationPerSecond: 25, // default: 20
            dftTimeSpan: dftTimeSpan, // default: 0.1
            spectrum: {
                elementId: rxSpectrumVisible ? 'rx-spectrum' : null,
                height: 150
            },
            constellationDiagram: {
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

function receive(channelIndex, carrierDetail, time) {
    var
        pskSize = parseInt(document.getElementById('rx-psk-size-' + channelIndex).value),
        powerThreshold = parseInt(document.getElementById('rx-power-threshold-' + channelIndex).value),
        i, j, elementPower, elementPhase, elementSymbolContainer, elementSymbolList, cd, symbol
    ;

    // console.log(time);   // TODO remove me

    for (i = 0; i < carrierDetail.length; i++) {
        elementPower = document.getElementById('rx-power-' + channelIndex + '-' + i);
        elementPhase = document.getElementById('rx-phase-' + channelIndex + '-' + i);
        elementSymbolContainer = document.getElementById('rx-symbol-' + channelIndex + '-' + i);
        elementSymbolList = document.querySelectorAll('#rx-symbol-' + channelIndex + '-' + i + ' > span');

        cd = carrierDetail[i];

        if (cd.powerDecibel >= powerThreshold) {
            symbol = Math.round(cd.phase * pskSize) % pskSize;
        } else {
            symbol = null;
        }

        for (j = 0; j < elementSymbolList.length; j++) {
            elementSymbolList[j].className = j === symbol ? 'active' : '';
        }
        elementPower.innerHTML = Math.round(cd.powerDecibel);
        elementPhase.innerHTML = (
            Math.round(cd.phase * 360) + ', ' +
            Math.round(cd.phase * 100) / 100
        );
    }
}

function transmit(channelIndex) {
    var dataFrame = document.getElementById('tx-data-frame-' + channelIndex).value + '';

    transmitDataFrame(channelIndex, dataFrame);
}

function transmitDataFrame(channelIndex, dataFrame) {
    var
        symbolDuration = parseFloat(document.getElementById('symbol-duration').value) / 1000,
        guardInterval = parseFloat(document.getElementById('guard-interval').value) / 1000,
        pskSize = parseInt(document.getElementById('tx-psk-size-' + channelIndex).value),
        ofdmBurstList = dataFrame.split(' '),
        ofdmBurstSymbolList, ofdmBurstSymbol,
        amplitude, data, dataFrameParsed, mute, i, j
    ;

    dataFrameParsed = [];
    for (i = 0; i < ofdmBurstList.length; i++) {
        ofdmBurstSymbolList = ofdmBurstList[i].split('.');

        data = [];
        for (j = 0; j < ofdmBurstSymbolList.length; j++) {
            mute = ofdmBurstSymbolList[j] === '-';
            ofdmBurstSymbol = mute ? 0 : parseInt(ofdmBurstSymbolList[j]) % pskSize;
            amplitude = parseFloat(document.getElementById('tx-amplitude-input-' + channelIndex + '-' + j).value);

            data.push({
                amplitude: mute ? 0 : amplitude,
                duration: symbolDuration,
                phase: ofdmBurstSymbol / pskSize
            });
        }
        dataFrameParsed.push(data);

        if (guardInterval === 0) {
            continue;
        }

        data = [];
        for (j = 0; j < ofdmBurstSymbolList.length; j++) {
            data.push({
                amplitude: 0,
                duration: guardInterval
            });
        }
        dataFrameParsed.push(data);
    }
    
    for (i = 0; i < dataFrameParsed.length; i++) {
        anpl.tx(channelIndex, dataFrameParsed[i]);
    }
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

    uiRefresh();
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

    uiRefresh();
}

function rxInput(type) {
    var refresh = true;

    switch (type) {
        case 'mic':
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.MICROPHONE);
            break;
        case 'rxLoop':
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.TX);
            break;
        case 'rec':
            anpl.setRxInput(AudioNetworkPhysicalLayerConfiguration.INPUT.RECORDED_AUDIO);
        default:
            refresh = false;
    }

    if (refresh) {
        uiRefresh();
    }
}

function loadRecordedAudio() {
    anpl.loadRecordedAudio(
        document.getElementById('recorded-audio-url').value,
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
