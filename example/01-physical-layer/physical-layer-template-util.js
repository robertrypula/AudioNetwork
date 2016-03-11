'use strict';

// Madness starts below... Don't ask me why I wanted to 
// keep examples framework-free (like AngularJs) :)

function generateHtml(tx, rx) {
    $$generateHtmlForChannel(tx, 'tx');
    $$generateHtmlForChannel(rx, 'rx');
}

function initializeHtml() {
    var fieldType, i, element;

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

    // refresh other stuff
    uiRefresh();
}

function uiRefreshOnPskSizeChange(rxTx, channelIndex) {
    $$uiRefreshOnPskSizeChangeSymbolSpecific(rxTx, channelIndex);

    // TODO add text area update
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

function $$uiRefreshOnPskSizeChangeSymbolSpecific(rxTx, channelIndex) {
    var i, j, k, element, pskSize, dataFrame, dataFrameList, channelOfdmSize;

    if (rxTx === 'rx') {
        channelOfdmSize = anpl.getRxChannelOfdmSize(channelIndex);
    } else {
        channelOfdmSize = anpl.getTxChannelOfdmSize(channelIndex);
    }
    pskSize = parseInt(document.getElementById(rxTx + '-psk-size-' + channelIndex).value);

    for (i = 0; i < channelOfdmSize; i++) {
        element = document.getElementById(rxTx + '-symbol-' + channelIndex + '-' + i);
        element.innerHTML = '';
        for (j = 0; j < pskSize; j++) {
            if (rxTx === 'tx') {
                dataFrameList = [];
                for (k = 0; k < channelOfdmSize; k++) {
                    dataFrameList.push(i === k ? j : '-');
                }
                dataFrame = dataFrameList.join('.');
                element.innerHTML += (
                    '<a ' +
                    '    href="javascript:void(0)" ' +
                    '    onClick="transmitDataFrame(' + channelIndex + ', \'' + dataFrame + '\')" ' +
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
            pskSize = parseInt(document.getElementById(rxTx + '-psk-size-' + i).value);
            for (j = 0; j < anpl.getRxChannelOfdmSize(i); j++) {
                callback(i, j, pskSize);
            }
        }
    } else {
        for (i = 0; i < anpl.getTxChannelSize(); i++) {
            pskSize = parseInt(document.getElementById(rxTx + '-psk-size-' + i).value);
            for (j = 0; j < anpl.getTxChannelOfdmSize(i); j++) {
                callback(i, j, pskSize);
            }
        }
    }   
}
