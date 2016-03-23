'use strict';

/*
    Madness starts below... Don't ask me why I wanted to
    keep examples framework-free (like AngularJs) :)
*/

function getFloatById(elementId) {
    return parseFloat(document.getElementById(elementId).value);
}

function getIntById(elementId) {
    return parseInt(document.getElementById(elementId).value);
}

function getStrById(elementId) {
    return document.getElementById(elementId).value + '';
}

function addClass(elementIdOrElement, className) {
    var 
        element = typeof elementIdOrElement === 'string' ? 
            document.getElementById(elementIdOrElement) : 
            elementIdOrElement
    ;

    if (element.classList) {
        element.classList.add(className);
    } else {
        element.className += ' ' + className;
    }
}

function removeClass(elementIdOrElement, className) {
    var 
        element = typeof elementIdOrElement === 'string' ? 
            document.getElementById(elementIdOrElement) : 
            elementIdOrElement
    ;

    if (element.classList) {
        element.classList.remove(className);
    } else {
        element.className = element
            .className
            .replace(
                new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), 
                ' '
            )
        ;
    }
}

function generateHtml(tx, rx) {
    $$generateHtmlForChannel(tx, 'tx');
    $$generateHtmlForChannel(rx, 'rx');
}

function initializeHtml() {
    var fieldType, elementId, i, element, rxConstellationDiagramVisible, rxSpectrumVisible;

    // tx/rx inputs
    fieldType = ['frequency', 'phase-correction'];
    for (i = 0; i < fieldType.length; i++) {
        $$loopChannelOfdm('rx', function (channelIndex, ofdmIndex) {
            $$uiRefreshOfdmSpecific(fieldType[i], false, 'rx', channelIndex, ofdmIndex);
        });
        $$loopChannelOfdm('tx', function (channelIndex, ofdmIndex) {
            $$uiRefreshOfdmSpecific(fieldType[i], false, 'tx', channelIndex, ofdmIndex);
        });
    }

    // rx/tx symbol info/button
    for (i = 0; i < anpl.getTxChannelSize(); i++) {
        uiRefreshOnPskSizeChange('tx', i);
    }
    for (i = 0; i < anpl.getRxChannelSize(); i++) {
        uiRefreshOnPskSizeChange('rx', i);
    }

    // amplitude value setup
    $$loopChannelOfdm('tx', function (channelIndex, ofdmIndex) {
        element = document.getElementById('tx-amplitude-input-' + channelIndex + '-' + ofdmIndex);
        element.value = Math.floor(1000 / anpl.getTxChannelOfdmSize(channelIndex)) / 1000;
    });

    // conditional css setup - spectrum
    rxSpectrumVisible = !!document.getElementById('rx-spectrum-visible').checked;
    element = document.getElementById('rx-conditional-css-class-spectrum');
    if (rxSpectrumVisible) {
        element.className = element.getAttribute("class-with-spectrum");
    } else {
        element.className = element.getAttribute("class-without-spectrum");
    }

    // conditional css setup - constellation
    rxConstellationDiagramVisible = !!document.getElementById('rx-constellation-diagram-visible').checked;
    elementId = [
        'rx-conditional-css-class-cont-',
        'rx-conditional-css-class-cd-',
        'rx-conditional-css-class-widget-'
    ];
    $$loopChannelOfdm('rx', function (channelIndex, ofdmIndex) {
        for (i = 0; i < elementId.length; i++) {
            element = document.getElementById(
                elementId[i] + channelIndex + '-' + ofdmIndex
            );
            if (rxConstellationDiagramVisible) {
                element.className = element.getAttribute("class-with-constellation-diagram");
            } else {
                element.className = element.getAttribute("class-without-constellation-diagram");
            }
        }
    });

    // refresh other stuff
    uiRefresh();
    viewType('simple');
}

function viewType(type) {
    var query, i;

    query = document.querySelectorAll('.view-type')
    for (i = 0; i < query.length; i++) {
        addClass(query[i], 'hidden');
    }

    query = document.querySelectorAll('.view-type-' + type);
    for (i = 0; i < query.length; i++) {
        removeClass(query[i], 'hidden');
    }

    removeClass('view-type-simple', 'active');
    removeClass('view-type-medium', 'active');
    removeClass('view-type-complex', 'active');
    addClass('view-type-' + type, 'active');
}

function uiRefreshOnPskSizeChange(rxTx, channelIndex) {
    $$uiRefreshOnPskSizeChangeSymbolSpecific(rxTx, channelIndex);
    if (rxTx === 'tx') {
        $$uiRefreshOnPskSizeChangeDataPacketSpecific(channelIndex);
    }
}

function uiRefresh() {
    var fieldType, i;

    // general info
    document.getElementById('sample-rate').innerHTML = anpl.getSampleRate();
    document.getElementById('tx-buffer-size').innerHTML = anpl.getTxBufferSize();
    document.getElementById('rx-buffer-size').innerHTML = anpl.getRxBufferSize();

    // tx/rx labels
    fieldType = ['frequency', 'phase-correction'];
    for (i = 0; i < fieldType.length; i++) {
        $$loopChannelOfdm('rx', function (channelIndex, ofdmIndex) {
            $$uiRefreshOfdmSpecific(fieldType[i], true, 'rx', channelIndex, ofdmIndex);
        });
        $$loopChannelOfdm('tx', function (channelIndex, ofdmIndex) {
            $$uiRefreshOfdmSpecific(fieldType[i], true, 'tx', channelIndex, ofdmIndex);
        });
    }

    // buttons states
    $$uiRefreshButtonSpecific();
}

// ---

function $$generateHtmlForChannel(channel, rxTx) {
    var i, j, html, element;

    for (i = 0; i < channel.length; i++) {
        html = document.getElementById('template-' + rxTx + '-channel').innerHTML;
        html = html.replace(/\[\[ channelIndex ]]/g, i + '');
        element = document.getElementById(rxTx + '-channel-container');
        element.innerHTML = element.innerHTML + html;
        for (j = 0; j < channel[i].ofdmSize; j++) {
            html = document.getElementById('template-' + rxTx + '-channel-ofdm').innerHTML;
            html = html.replace(/\[\[ channelIndex ]]/g, i + '');
            html = html.replace(/\[\[ ofdmIndex ]]/g, j + '');
            element = document.getElementById(rxTx + '-channel-' + i + '-ofdm-container');
            element.innerHTML = element.innerHTML + html;
        }
    }
}

function $$uiRefreshButtonSpecific() {
    $$uiRefreshButtonOutputSpecific();
    $$uiRefreshButtonInputSpecific();
}

function $$uiRefreshButtonOutputSpecific() {
    if (anpl.getOutputTxState()) {
        addClass('tx-output-tx-enable', 'active');
        removeClass('tx-output-tx-disable', 'active');
    } else {
        removeClass('tx-output-tx-enable', 'active');
        addClass('tx-output-tx-disable', 'active');
    }

    if (anpl.getOutputMicrophoneState()) {
        addClass('tx-output-mic-enable', 'active');
        removeClass('tx-output-mic-disable', 'active');
    } else {
        removeClass('tx-output-mic-enable', 'active');
        addClass('tx-output-mic-disable', 'active');
    }

    if (anpl.getOutputRecordedAudioState()) {
        addClass('tx-output-rec-enable', 'active');
        removeClass('tx-output-rec-disable', 'active');
    } else {
        removeClass('tx-output-rec-enable', 'active');
        addClass('tx-output-rec-disable', 'active');
    }
}

function $$uiRefreshButtonInputSpecific() {
    removeClass('rx-input-mic', 'active');
    removeClass('rx-input-tx', 'active');
    removeClass('rx-input-rec', 'active');

    switch (anpl.getRxInput()) {
        case AudioNetworkPhysicalLayerConfiguration.INPUT.MICROPHONE:
            addClass('rx-input-mic', 'active');
            break;
        case AudioNetworkPhysicalLayerConfiguration.INPUT.TX:
            addClass('rx-input-tx', 'active');
            break;
        case AudioNetworkPhysicalLayerConfiguration.INPUT.RECORDED_AUDIO:
            addClass('rx-input-rec', 'active');
            break;
    }
}

function $$uiRefreshOnPskSizeChangeDataPacketSpecific(channelIndex) {
    var pskSize, element, channelOfdmSize, i, j, packetDataList, ofdmList;

    pskSize = getIntById('tx-psk-size-' + channelIndex);
    element = document.getElementById('tx-packet-data-' + channelIndex);
    channelOfdmSize = anpl.getTxChannelOfdmSize(channelIndex);
    packetDataList = [];

    for (i = 0; i < pskSize; i++) {
        ofdmList = [];
        for (j = 0; j < channelOfdmSize; j++) {
            ofdmList.push(i);
        }
        packetDataList.push(ofdmList.join('.'));
    }

    element.value = packetDataList.join(' ');
}

function $$uiRefreshOnPskSizeChangeSymbolSpecific(rxTx, channelIndex) {
    var i, j, k, element, pskSize, packetData, packetDataList, channelOfdmSize;

    if (rxTx === 'rx') {
        channelOfdmSize = anpl.getRxChannelOfdmSize(channelIndex);
    } else {
        channelOfdmSize = anpl.getTxChannelOfdmSize(channelIndex);
    }
    pskSize = getIntById(rxTx + '-psk-size-' + channelIndex);

    for (i = 0; i < channelOfdmSize; i++) {
        element = document.getElementById(rxTx + '-symbol-' + channelIndex + '-' + i);
        element.innerHTML = '';
        for (j = 0; j < pskSize; j++) {
            if (rxTx === 'tx') {
                packetDataList = [];
                for (k = 0; k < channelOfdmSize; k++) {
                    packetDataList.push(i === k ? j : '-');
                }
                packetData = packetDataList.join('.');
                // TODO refactor to: transmitSymbol(channelIndex, ofdmIndex, symbol);
                element.innerHTML += (
                    '<a ' +
                    '    href="javascript:void(0)" ' +
                    '    onClick="transmitSymbol(' + channelIndex + ', \'' + packetData + '\')" ' +
                    '    >' +
                    '   ' + j +
                    '</a>'
                );
            } else {
                element.innerHTML += (
                    '<span ' +
                    '    id="rx-symbol-' + channelIndex + '-' + i + '-' + j + '" '+
                    '    >' +
                    '   ' + j +
                    '</span>'
                );
            }
        }
    }
}

function $$uiRefreshOfdmSpecific(type, isLabel, rxTx, channelIndex, ofdmIndex) {
    var elementId, element, value;

    elementId = (
        rxTx + '-' + 
        type + '-' + 
        (isLabel ? 'label-' : 'input-') + 
        channelIndex + '-' + 
        ofdmIndex
    );
    element = document.getElementById(elementId);

    switch (type) {
        case 'frequency':
            if (rxTx === 'tx') {
                value = anpl.getTxFrequency(channelIndex, ofdmIndex);
            } else {
                value = anpl.getRxFrequency(channelIndex, ofdmIndex);
            }
            break;
        case 'phase-correction':
            if (rxTx === 'tx') {
                value = anpl.getTxPhaseCorrection(channelIndex, ofdmIndex);
            } else {
                value = anpl.getRxPhaseCorrection(channelIndex, ofdmIndex);
            }
            break;
    }
    
    element[isLabel ? 'innerHTML' : 'value'] = value;
}

function $$loopChannelOfdm(rxTx, callback) {
    var i, j, pskSize;

    if (rxTx === 'rx') {
        for (i = 0; i < anpl.getRxChannelSize(); i++) {
            pskSize = getIntById(rxTx + '-psk-size-' + i);
            for (j = 0; j < anpl.getRxChannelOfdmSize(i); j++) {
                callback(i, j, pskSize);
            }
        }
    } else {
        for (i = 0; i < anpl.getTxChannelSize(); i++) {
            pskSize = getIntById(rxTx + '-psk-size-' + i);
            for (j = 0; j < anpl.getTxChannelOfdmSize(i); j++) {
                callback(i, j, pskSize);
            }
        }
    }   
}
