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
        document.getElementById('tx-channel-container').innerHTML = '';
        document.getElementById('rx-channel-container').innerHTML = '';
        anpl = null;
    }
}

function receive(channelIndex, carrierDetail, time) {
    var i, elementPower, elementPhase, cd;

    // console.log(time);   // TODO remove me

    for (i = 0; i < carrierDetail.length; i++) {
        elementPower = document.getElementById('rx-power-' + channelIndex + '-' + i);
        elementPhase = document.getElementById('rx-phase-' + channelIndex + '-' + i);

        cd = carrierDetail[i];
        elementPower.innerHTML = Math.round(cd.powerDecibel);
        elementPhase.innerHTML = (
            Math.round(cd.phase * 360) + ' / ' +
            Math.round(cd.phase * 100) / 100
        );
    }
}

function transmitSequence(channelIndex) {
    var
        symbolDuration = parseFloat(document.getElementById('symbol-duration').value) / 1000,
        guardInterval = parseFloat(document.getElementById('guard-interval').value) / 1000,
        sequenceData = document.getElementById('tx-sequence-data-' + channelIndex).value + '',
        pskSize = parseInt(document.getElementById('tx-sequence-psk-size-' + channelIndex).value),
        ofdmBurstList = sequenceData.split(' '),
        ofdmBurstSymbolList, ofdmBurstSymbol,
        amplitude, data, dataFrame, mute, i, j
    ;

    dataFrame = [];
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
        dataFrame.push(data);

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
        dataFrame.push(data);
    }
    
    for (i = 0; i < dataFrame.length; i++) {
        anpl.tx(channelIndex, dataFrame[i]);
    }
}

function uiRefresh(type, isLabel, rxTx, channelIndex, ofdmIndex) {
    var elementId, element, value, methodSubName;

    elementId = rxTx + '-' + type + '-' + (isLabel ? 'label-' : 'input-') + channelIndex + '-' + ofdmIndex;
    element = document.getElementById(elementId);
    methodSubName = rxTx === 'tx' ? 'Tx' : 'Rx';

    switch (type) {
        case 'frequency':
            value = anpl['get' + methodSubName + 'Frequency'](channelIndex, ofdmIndex);
            break;
        case 'phase-correction':
            value = anpl['get' + methodSubName + 'PhaseCorrection'](channelIndex, ofdmIndex);
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
            anpl.outputRecordedAudioEnable();
        },
        function () {
            alert('Error');
        }
    );
}

function output(type, state) {
    var methodSuffix = state ? 'Enable' : 'Disable';

    switch (type) {
        case 'tx':
            anpl['outputTx' + methodSuffix]();
            break;
        case 'mic':
            anpl['outputMicrophone' + methodSuffix]();
            break;
        case 'rec':
            anpl['outputRecordedAudio' + methodSuffix]();
            break;
    }
}
