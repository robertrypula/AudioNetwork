// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    ASCII_NULL = 0,
    UNICODE_UNKNOWN = '�',
    RAW_SYMBOL_MAX = 10,
    dataLinkLayerBuilder,
    dataLinkLayer,
    rawSymbolBuffer = new Buffer(RAW_SYMBOL_MAX);

function init() {
    dataLinkLayerBuilder = new DataLinkLayerBuilder();
    dataLinkLayer = dataLinkLayerBuilder
        .frameListener(frameListener)
        .frameCandidateListener(frameCandidateListener)
        .txListener(txListener)
        .rxSampleListener(rxSampleListener)
        .configListener(configListener)
        .txConfigListener(txConfigListener)
        .rxConfigListener(rxConfigListener)
        .build();

    dataLinkLayer.setLoopback(true);
}

function frameListener(frame) {
    /*
        {
            id: 0,
            header: 0xF5,
            payload: [0x32, 0x32, 0x32, 0x32, 0x32],
            checksum: 0x23,
            isCommand: false,
            frameCandidateId: 3
        }
    */
    html('#rx-frame-id', frame.id);
    html('#rx-frame-header', getHexFromByte(frame.header));
    html('#rx-frame-payload', getHexFromByteList(frame.payload));
    html('#rx-frame-checksum', getHexFromByte(frame.checksum));
    html('#rx-frame-is-command', frame.isCommand ? 'yes' : 'no');
    html('#rx-frame-candidate-id', frame.frameCandidateId);

    html('#rx-frame-payload-as-ascii', getAsciiFromByteList(frame.payload));
}

function frameCandidateListener(frameCandidateList) {
    var i, fc, progress, htmlContent = '';
    /*
        {
            id: 4,
            received: [32, 32],
            expected: 8,
            isValid: false,
            symbolId: []
        }
    */
    for (i = 0; i < frameCandidateList.length; i++) {
        fc = frameCandidateList[i];
        progress = fc.received.length + '/' + fc.expected + ' ' +
            '(' + (100 * fc.received.length / fc.expected).toFixed(0) + '%)';
        htmlContent += '<div class="rx-box-with-border">';
        htmlContent += '<strong>Id:</strong> ' + fc.id + '<br/>';
        htmlContent += '<strong>Progress:</strong> ' + progress + '<br/>';
        htmlContent += '<strong>Received:</strong> ' + getHexFromByteList(fc.received) + '<br/>';
        htmlContent += '<strong>IsValid:</strong> ' + (fc.isValid ? 'yes' : 'no') + '<br/>';
        htmlContent += '<strong>SymbolId:</strong> ' + fc.symbolId.join(', ') + '<br/>';
        htmlContent += '</div>';
    }

    html('#rx-frame-candidate', htmlContent);
}

function txListener(state) {
    var
        txConfig = dataLinkLayer.getPhysicalLayer().getTxConfig(),
        symbolMin = txConfig.symbolMin,
        txCurrent = state.symbol
            ? getHexFromSymbol(state.symbol, symbolMin)
            : 'idle',
        txQueue = getHexFromSymbolList(state.symbolQueue, symbolMin);

    html('#tx-hex-current', txCurrent);
    html('#tx-hex-queue', txQueue);
}

function rxSampleListener(state) {
    var
        rxConfig = dataLinkLayer.getPhysicalLayer().getRxConfig(),
        symbolMin = rxConfig.symbolMin;

    html('#sync', state.syncId === null ? 'waiting for sync...' : 'OK');
    html('#sync-in-progress', state.isSyncInProgress ? '[sync in progress]' : '');

    if (state.isSymbolSamplingPoint) {
        rawSymbolBuffer.pushEvenIfFull(state.symbolRaw);
        html('#rx-raw-data', getHexFromSymbolList(rawSymbolBuffer.getAll(), symbolMin));
    }
}

function configListener(state) {
    setActive(
        '#loopback-container',
        '#loopback-' + (state.isLoopbackEnabled ? 'enabled' : 'disabled')
    );
}

function txConfigListener(state) {
    setActive('#tx-sample-rate-container', '#tx-sample-rate-' + state.sampleRate);
}

function rxConfigListener(state) {
    html('#rx-sample-rate', (state.sampleRate / 1000).toFixed(1));
}

// ---------

function onTxSampleRateClick(txSampleRate) {
    dataLinkLayer.setTxSampleRate(txSampleRate);
}

function onLoopbackClick(state) {
    dataLinkLayer.setLoopback(state);
}

function onSendSyncClick() {
    dataLinkLayer.sendSync();
}

function onSendHexClick() {
    var
        textSplit = getFormFieldValue('#tx-hex', 'split'),
        payload = [],
        byte,
        i;

    for (i = 0; i < textSplit.length; i++) {
        byte = parseInt(textSplit[i], 16);
        if (0 <= byte && byte <= 255) {
            payload.push(byte);
        }
    }
    sendFrame(payload);
}

function onSendAsciiClick() {
    var
        text = getFormFieldValue('#tx-ascii'),
        payload = [],
        byte,
        i;

    for (i = 0; i < text.length; i++) {
        byte = isPrintableAscii(text[i])
            ? text.charCodeAt(i)
            : ASCII_NULL;
        payload.push(byte);
    }
    sendFrame(payload);
}

function sendFrame(payload) {
    try {
        dataLinkLayer.sendFrame(payload);
    } catch (e) {
        alert(e);
    }
}

// ---------

function isPrintableAscii(char) {
    return char >= ' ' && char <= '~';
}

function getHexFromByte(byte) {
    var byteHex = byte.toString(16);

    return pad(byteHex, 2)
}

function getHexFromByteList(byteList) {
    var i, byte, result = [];

    for (i = 0; i < byteList.length; i++) {
        byte = byteList[i];
        result.push(
            getHexFromByte(byte)
        );
    }

    return result.join(' ');
}

function getHexFromSymbol(symbol, symbolMin) {
    var
        byte = symbol - symbolMin,
        byteHex = byte.toString(16);

    if (byte > 255) {
        // two symbols at the end of the range are 'sync' symbols
        return '[' + pad(byteHex, 3) + ' sync]';
    }

    return pad(byteHex, 2)
}

function getHexFromSymbolList(symbolList, symbolMin) {
    var i, symbol, result = [];

    for (i = 0; i < symbolList.length; i++) {
        symbol = symbolList[i];
        result.push(
            getHexFromSymbol(symbol, symbolMin)
        );
    }

    return result.join(' ');
}

function pad(num, size) {
    var s = '000000000' + num;

    return s.substr(s.length - size);
}

function getAsciiFromByteList(byteList) {
    var i, char, result = '';

    for (i = 0; i < byteList.length; i++) {
        char = String.fromCharCode(byteList[i]);
        result += isPrintableAscii(char) ? char : UNICODE_UNKNOWN;
    }

    return result;
}
