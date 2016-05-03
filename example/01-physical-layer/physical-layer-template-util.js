'use strict';

/*
    Madness starts below... Don't ask me why I wanted to
    keep examples framework-free (like AngularJs) :)
*/

var currentViewType = 'simple';

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
    for (i = 0; i < physicalLayer.getTxChannelSize(); i++) {
        uiRefreshOnPskSizeChange('tx', i);
    }
    for (i = 0; i < physicalLayer.getRxChannelSize(); i++) {
        uiRefreshOnPskSizeChange('rx', i);
    }

    // amplitude value setup
    $$loopChannelOfdm('tx', function (channelIndex, ofdmIndex) {
        element = document.getElementById('tx-amplitude-input-' + channelIndex + '-' + ofdmIndex);
        element.value = Math.floor(1000 / physicalLayer.getTxChannelOfdmSize(channelIndex)) / 1000;
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
    viewType(currentViewType);
}

function viewType(type) {
    var query, i;

    query = document.querySelectorAll('.view-type');
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

    currentViewType = type;
}

function enabledChanged(rxTx) {
    var
        element = document.getElementById(rxTx + '-channel-config'),
        enabled = !!document.getElementById(rxTx + '-enabled').checked
    ;

    element.disabled = !enabled;
}

function uiRefreshOnPskSizeChange(rxTx, channelIndex) {
    $$uiRefreshOnPskSizeChangeSymbolSpecific(rxTx, channelIndex);
    $$uiRefreshSpeedSpecific(rxTx);
    if (rxTx === 'tx') {
        $$uiRefreshOnPskSizeChangeDataPacketSpecific(channelIndex);
    }
}

function uiRefresh() {
    var fieldType, i;

    // general info
    document.getElementById('sample-rate').innerHTML = physicalLayer.getSampleRate();
    document.getElementById('tx-buffer-size').innerHTML = physicalLayer.getTxBufferSize();
    document.getElementById('rx-buffer-size').innerHTML = physicalLayer.getRxBufferSize();

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

    // speed update
    $$uiRefreshSpeedSpecific('rx');
    $$uiRefreshSpeedSpecific('tx');
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
    if (physicalLayer.getOutputTxState()) {
        addClass('tx-output-tx-enable', 'active');
        removeClass('tx-output-tx-disable', 'active');
    } else {
        removeClass('tx-output-tx-enable', 'active');
        addClass('tx-output-tx-disable', 'active');
    }

    if (physicalLayer.getOutputMicrophoneState()) {
        addClass('tx-output-mic-enable', 'active');
        removeClass('tx-output-mic-disable', 'active');
    } else {
        removeClass('tx-output-mic-enable', 'active');
        addClass('tx-output-mic-disable', 'active');
    }

    if (physicalLayer.getOutputRecordedAudioState()) {
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

    switch (physicalLayer.getRxInput()) {
        case PhysicalLayerInput.MICROPHONE:
            addClass('rx-input-mic', 'active');
            break;
        case PhysicalLayerInput.TX:
            addClass('rx-input-tx', 'active');
            break;
        case PhysicalLayerInput.RECORDED_AUDIO:
            addClass('rx-input-rec', 'active');
            break;
    }
}

function $$uiRefreshOnPskSizeChangeDataPacketSpecific(channelIndex) {
    var pskSize, element, channelOfdmSize, i, j, packetDataList, ofdmList;

    pskSize = getIntById('tx-psk-size-' + channelIndex);
    element = document.getElementById('tx-packet-data-' + channelIndex);
    channelOfdmSize = physicalLayer.getTxChannelOfdmSize(channelIndex);
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
    var ofdmIndex, symbol, element, pskSize, channelOfdmSize;

    if (rxTx === 'rx') {
        channelOfdmSize = physicalLayer.getRxChannelOfdmSize(channelIndex);
    } else {
        channelOfdmSize = physicalLayer.getTxChannelOfdmSize(channelIndex);
    }
    pskSize = getIntById(rxTx + '-psk-size-' + channelIndex);

    for (ofdmIndex = 0; ofdmIndex < channelOfdmSize; ofdmIndex++) {
        element = document.getElementById(rxTx + '-symbol-' + channelIndex + '-' + ofdmIndex);
        element.innerHTML = '';
        for (symbol = 0; symbol < pskSize; symbol++) {
            if (rxTx === 'tx') {
                element.innerHTML += (
                    '<a ' +
                    '    href="javascript:void(0)" ' +
                    '    onClick="transmitSymbol(' + channelIndex + ', ' + ofdmIndex + ', ' + symbol + ')" ' +
                    '    >' +
                    '   ' + symbol +
                    '</a>'
                );
            } else {
                element.innerHTML += (
                    '<span ' +
                    '    id="rx-symbol-' + channelIndex + '-' + ofdmIndex + '-' + symbol + '" '+
                    '    >' +
                    '   ' + symbol +
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
                value = physicalLayer.getTxFrequency(channelIndex, ofdmIndex);
            } else {
                value = physicalLayer.getRxFrequency(channelIndex, ofdmIndex);
            }
            break;
        case 'phase-correction':
            if (rxTx === 'tx') {
                value = physicalLayer.getTxPhaseCorrection(channelIndex, ofdmIndex);
            } else {
                value = physicalLayer.getRxPhaseCorrection(channelIndex, ofdmIndex);
            }
            break;
    }

    element[isLabel ? 'innerHTML' : 'value'] = value;
}

function $$uiRefreshSpeedSpecific(rxTx) {
    var
        element, i, pskSize,
        symbolDuration = getFloatById('symbol-duration') / 1000,
        guardInterval = getFloatById('guard-interval') / 1000,
        symbolPerSecond = 1 / (symbolDuration + guardInterval),
        bitPerSecond
    ;

    if (rxTx === 'rx') {
        for (i = 0; i < physicalLayer.getRxChannelSize(); i++) {
            pskSize = getIntById(rxTx + '-psk-size-' + i);
            element = document.getElementById('rx-speed-' + i);
            bitPerSecond = (pskSize - 1).toString(2).length * symbolPerSecond * physicalLayer.getRxChannelOfdmSize(i);
            element.innerHTML = bitPerSecond;
        }
    } else {
        for (i = 0; i < physicalLayer.getTxChannelSize(); i++) {
            pskSize = getIntById(rxTx + '-psk-size-' + i);
            element = document.getElementById('tx-speed-' + i);
            bitPerSecond = (pskSize - 1).toString(2).length * symbolPerSecond * physicalLayer.getTxChannelOfdmSize(i);
            element.innerHTML = bitPerSecond;
        }
    }
}

function $$loopChannelOfdm(rxTx, callback) {
    var i, j, pskSize;

    if (rxTx === 'rx') {
        for (i = 0; i < physicalLayer.getRxChannelSize(); i++) {
            pskSize = getIntById(rxTx + '-psk-size-' + i);
            for (j = 0; j < physicalLayer.getRxChannelOfdmSize(i); j++) {
                callback(i, j, pskSize);
            }
        }
    } else {
        for (i = 0; i < physicalLayer.getTxChannelSize(); i++) {
            pskSize = getIntById(rxTx + '-psk-size-' + i);
            for (j = 0; j < physicalLayer.getTxChannelOfdmSize(i); j++) {
                callback(i, j, pskSize);
            }
        }
    }
}
