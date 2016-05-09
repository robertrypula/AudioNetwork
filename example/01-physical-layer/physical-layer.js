'use strict';

var 
    physicalLayer = null,
    physicalLayerDestroyInProgress = false,
    transmitAdapter = null,
    receiveAdapter = null,
    txInput = AudioNetwork.PhysicalLayer.DefaultConfig.RX_INPUT
;

function onLoad() {
    quickConfigure(1, 2, 4, 1);
    setupCpuLoadNotification();
}

function setupCpuLoadNotification() {
    var rxLoad, txLoad;

    rxLoad = document.getElementById('load-rx');
    txLoad = document.getElementById('load-tx');

    setInterval(function () {
        if (physicalLayer && !physicalLayerDestroyInProgress) {
            rxLoad.innerHTML = Math.round(physicalLayer.getRxCpuLoadData().load * 100);
            txLoad.innerHTML = Math.round(physicalLayer.getTxCpuLoadData().load * 100);
        }
    }, 200);
}

function quickConfigure(channelNumber, pskSize, baud, ofdmSize) {
    var
        DefaultConfig = AudioNetwork.PhysicalLayer.DefaultConfig,
        ofdmSpacing, baudMultiplicativeInverse, config, i,
        element, symbolDuration, guardInterval, symbolFrequency
    ;

    if (channelNumber < 1 || channelNumber > 2) {
        throw 'Not supported quickConfiguration parameters';
    }

    baudMultiplicativeInverse = 1.0 / baud;
    symbolDuration = DefaultConfig.FACTOR_SYMBOL * baudMultiplicativeInverse;
    guardInterval = DefaultConfig.FACTOR_GUARD * baudMultiplicativeInverse;
    ofdmSpacing = DefaultConfig.OFDM_FREQUENCY_SPACING_POSITIVE_INTEGER / symbolDuration;
    symbolFrequency = 1 / symbolDuration;

    document.getElementById('rx-dft-window-time').value = Math.round(symbolDuration * 1000 * 10) / 10;
    document.getElementById('rx-notification-per-second').value = Math.round(DefaultConfig.SYMBOL_FREQUENCY_FACTOR * symbolFrequency);
    document.getElementById('symbol-duration').value = Math.round(symbolDuration * 1000 * 10) / 10;
    document.getElementById('guard-interval').value = Math.round(guardInterval * 1000 * 10) / 10;
    document.getElementById('interpacket-gap').value = Math.round(DefaultConfig.FACTOR_INTERPACKET_GAP * guardInterval * 1000 * 10) / 10;

    if (channelNumber === 1) {
        config = DefaultConfig.CHANNEL_1_FREQUENCY + '-' + ofdmSize + '-' + ofdmSpacing;
        document.getElementById('tx-channel-config').value = config;
        document.getElementById('rx-channel-config').value = config;
    } else {
        config = DefaultConfig.CHANNEL_1_FREQUENCY + '-' + ofdmSize + '-' + ofdmSpacing + ' ' + DefaultConfig.CHANNEL_2_FREQUENCY + '-' + ofdmSize + '-' + ofdmSpacing;
        document.getElementById('tx-channel-config').value = config;
        document.getElementById('rx-channel-config').value = config;
    }

    collectSettingsAndInit(function () {
        for (i = 0; i < physicalLayer.getRxChannelSize(); i++) {
            element = document.getElementById('rx-psk-size-' + i);
            element.value = pskSize;
            element.onchange();
        }
        for (i = 0; i < physicalLayer.getTxChannelSize(); i++) {
            element = document.getElementById('tx-psk-size-' + i);
            element.value = pskSize;
            element.onchange();
        }
    });
}

function collectSettingsAndInit(cb) {
    var
        txChannel = [],
        rxChannel = [],
        txRx = [],
        dftWindowTime,
        notificationPerSecond,
        rxSpectrumVisible, rxConstellationDiagramVisible,
        enabled,
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
        enabled = !!document.getElementById(txRx[i].id + '-enabled').checked;
        channelDataList = value === '' || !enabled ? [] : (value).split(' ');
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
    dftWindowTime = getFloatById('rx-dft-window-time');
    notificationPerSecond = getIntById('rx-notification-per-second');

    destroy(function () {
        initialize(txChannel, rxChannel, rxSpectrumVisible, rxConstellationDiagramVisible, notificationPerSecond, dftWindowTime);

        if (typeof cb === 'function') {
            cb();
        }
    });
}

function initialize(txChannel, rxChannel, rxSpectrumVisible, rxConstellationDiagramVisible, notificationPerSecond, dftWindowTime) {
    var historyPointSize = notificationPerSecond;

    generateHtml(txChannel, rxChannel);

    physicalLayer = new AudioNetwork.PhysicalLayer.PhysicalLayer({
        tx: {
            channel: txChannel
        },
        rx: {
            channel: rxChannel,
            input: txInput,
            notificationPerSecond: notificationPerSecond,
            dftWindowTime: dftWindowTime / 1000,
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
                historyPointSize: historyPointSize
            }
        }
    });
    transmitAdapter = new AudioNetwork.PhysicalLayer.TransmitAdapter(physicalLayer);
    receiveAdapter = new AudioNetwork.PhysicalLayer.ReceiveAdapter(physicalLayer);

    var powerChartQueue0 = new AudioNetwork.Common.Queue(400);
    // var powerChart0 = new AudioNetwork.PhysicalLayer.PowerChart(document.getElementById('rx-power-chart-0'), 400, 2 * 80, powerChartQueue0);

    physicalLayer.rx(function (channelIndex, carrierDetail, time) {
        var element = document.getElementById('rx-sampling-state-v2-' + channelIndex);  // TODO refactor this
        var receiveData;

        if (powerChartQueue0.isFull()) {
            powerChartQueue0.pop()
        }
        powerChartQueue0.push(carrierDetail[0].powerDecibel);

        receiveData = receiveAdapter.receive(channelIndex, carrierDetail, time); // receive (higher level)
        element.innerHTML = receiveData.state + ' ' + receiveData.power;

        receive(channelIndex, carrierDetail, time); // rx (lowest level)
    });
    receiveAdapter.setPacketReceiveHandler(function (channelIndex, data) {
        var str, i, uiPacketHistory = document.getElementById('rx-sampling-packet-history-' + channelIndex);

        str = '';
        for (i = 0; i < data.length; i++) {
            str += (typeof data[i] === 'number' ? data[i] : data[i].join(', ')) + ' | ';
        }
        uiPacketHistory.innerHTML = str + '&nbsp;<br/>' + uiPacketHistory.innerHTML;
    });
    receiveAdapter.setFrequencyUpdateHandler(function (channelIndex, data) {
        console.log('freq update');
        uiRefresh();
    });
    receiveAdapter.setPhaseCorrectionUpdateHandler(function (channelIndex, data) {
        console.log('phase update');
        uiRefresh();
    });

    initializeHtml();
}


function destroy(cb) {
    if (physicalLayer) {
        physicalLayerDestroyInProgress = true;
        physicalLayer.destroy().then(function () {
            transmitAdapter = null;
            receiveAdapter = null;
            physicalLayer = null;
            document.getElementById('tx-channel-container').innerHTML = '';
            document.getElementById('rx-channel-container').innerHTML = '';

            physicalLayerDestroyInProgress = false;
            if (typeof cb === 'function') {
                cb();
            }
        });
    } else {
        if (typeof cb === 'function') {
            cb();
        }        
    }
}

function receiveAdapterReset(channelIndex) {
    var uiPacketHistory = document.getElementById('rx-sampling-packet-history-' + channelIndex);

    receiveAdapter.reset(channelIndex);
    uiPacketHistory.innerHTML = '';
}

function frequencyUpdate(rxTx, channelIndex, ofdmIndex) {
    var elementId, newFrequency;

    elementId = rxTx + '-frequency-input-' + channelIndex + '-' + ofdmIndex;
    newFrequency = getFloatById(elementId);

    if (rxTx === 'tx') {
        physicalLayer.setTxFrequency(channelIndex, ofdmIndex, newFrequency);
    } else {
        physicalLayer.setRxFrequency(channelIndex, ofdmIndex, newFrequency);
    }

    uiRefresh();
}

function phaseCorrectionUpdate(rxTx, channelIndex, ofdmIndex) {
    var elementId, newFrequency;

    elementId = rxTx + '-phase-correction-input-' + channelIndex + '-' + ofdmIndex;
    newFrequency = getFloatById(elementId);

    if (rxTx === 'tx') {
        physicalLayer.setTxPhaseCorrection(channelIndex, ofdmIndex, newFrequency);
    } else {
        physicalLayer.setRxPhaseCorrection(channelIndex, ofdmIndex, newFrequency);
    }

    uiRefresh();
}

function rxInput(type) {
    var input = null;

    switch (type) {
        case 'mic':
            input = AudioNetwork.PhysicalLayer.PhysicalLayerInput.MICROPHONE;
            break;
        case 'loopback':
            input = AudioNetwork.PhysicalLayer.PhysicalLayerInput.LOOPBACK;
            break;
        case 'rec':
            input = AudioNetwork.PhysicalLayer.PhysicalLayerInput.RECORDED_AUDIO;
            break;
    }

    if (input !== null) {
        physicalLayer.setRxInput(input);
        txInput = input;
        uiRefresh();
    }
}

function loadRecordedAudio() {
    physicalLayer.loadRecordedAudio(
        getStrById('recorded-audio-url'),
        function () {
            physicalLayer.setRxInput(AudioNetwork.PhysicalLayer.PhysicalLayerInput.RECORDED_AUDIO);
            physicalLayer.outputRecordedAudioEnable();
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
                physicalLayer.outputTxEnable();
            } else {
                physicalLayer.outputTxDisable();
            }
            break;
        case 'mic':
            if (state) {
                physicalLayer.outputMicrophoneEnable();
            } else {
                physicalLayer.outputMicrophoneDisable();
            }
            break;
        case 'rec':
            if (state) {
                physicalLayer.outputRecordedAudioEnable();
            } else {
                physicalLayer.outputRecordedAudioDisable();
            }
            break;
        default:
            refresh = false;
    }

    if (refresh) {
        uiRefresh();
    }
}

function symbolDurationChange() {
    var value = getIntById('symbol-duration');

    receiveAdapter.setSymbolDuration(value);
    uiRefresh();
}

function guardIntervalChange() {
    var value = getIntById('guard-interval');

    receiveAdapter.setGuardInterval(value);
    uiRefresh();
}

function syncPreambleChange() {
    var value = !!document.getElementById('sync-preamble').checked;

    receiveAdapter.setSyncPreamble(value);
    uiRefresh();
}

function pskSizeChange(channelIndex) {
    var value = getIntById('rx-psk-size-' + channelIndex);

    receiveAdapter.setPskSize(channelIndex, value);
    uiRefreshOnPskSizeChange('rx', channelIndex);
}
