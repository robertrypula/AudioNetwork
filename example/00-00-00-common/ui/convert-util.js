// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    CHAR_UNICODE_UNKNOWN = '�',
    ASCII_NULL = 0x00,
    SYMBOL_ZERO_PADDING = 3;

function getStringFromSymbolArray(symbolArray) {
    var i, tmp, symbol, formatted = [];

    for (i = 0; i < symbolArray.length; i++) {
        symbol = symbolArray[i];
        tmp = symbol <= 0
            ? '[gap]'
            : pad(symbolArray[i], SYMBOL_ZERO_PADDING);
        formatted.push(tmp);
    }

    return formatted.join(' ');
}

function byteToHex(byte) {
    return (byte < 16 ? '0' : '') + byte.toString(16).toUpperCase();
}

function isPrintableAscii(char) {
    return char >= ' ' && char <= '~';
}

function getByteHexFromByte(byte) {
    var byteHex = byte.toString(16);

    return pad(byteHex, 2)
}

function getByteHexFromByteList(byteList) {
    var i, byte, result = [];

    for (i = 0; i < byteList.length; i++) {
        byte = byteList[i];
        result.push(
            getByteHexFromByte(byte)
        );
    }

    return result.join(' ');
}

function getByteHexFromSymbol(symbol, symbolMin) {
    var
        byte = symbol - symbolMin,
        byteHex = byte.toString(16);

    if (symbol <= 0) {
        return '[gap]';
    }

    if (byte > 255) {
        // two symbols at the end of the range are 'sync' symbols
        return '[sync' + (byte === 256 ? 'A' : 'B') + ']';
    }

    return pad(byteHex, 2)
}

function getByteHexFromSymbolList(symbolList, symbolMin) {
    var i, symbol, result = [];

    for (i = 0; i < symbolList.length; i++) {
        symbol = symbolList[i];
        result.push(
            getByteHexFromSymbol(symbol, symbolMin)
        );
    }

    return result.join(' ');
}

function getAsciiFromByteList(byteList) {
    var i, char, result = '';

    for (i = 0; i < byteList.length; i++) {
        char = getAsciiFromByte(byteList[i]);
        result += char;
    }

    return result;
}

function getAsciiFromByte(byte) {
    var char = String.fromCharCode(byte);

    return isPrintableAscii(char)
        ? char
        : CHAR_UNICODE_UNKNOWN;
}

function getByteListFromAsciiString(text) {
    var i, byte, byteList = [];

    for (i = 0; i < text.length; i++) {
        byte = isPrintableAscii(text[i])
            ? text.charCodeAt(i)
            : ASCII_NULL;
        byteList.push(byte);
    }

    return byteList;
}

function pad(num, size) {
    var s = '000000000' + num;

    return s.substr(s.length - size);
}

function formatTxSymbolRange(state) {
    var s;

    s = 'txSymbolMin: ' + state.txSymbolMin + '&nbsp;(' + (state.txSymbolMin * state.txSymbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'rxSymbolMax: ' + state.txSymbolMax + '&nbsp;(' + (state.txSymbolMax * state.txSymbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'txSymbolFrequencySpacing: ' + state.txSymbolFrequencySpacing.toFixed(2) + ' Hz';

    return s;
}

function formatRxSymbolRange(state) {
    var s;

    s = 'txSymbolMin: ' + state.rxSymbolMin + '&nbsp;(' + (state.rxSymbolMin * state.rxSymbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'rxSymbolMax: ' + state.rxSymbolMax + '&nbsp;(' + (state.rxSymbolMax * state.rxSymbolFrequencySpacing).toFixed(0) + '&nbsp;Hz)<br/>' +
        'rxSymbolFrequencySpacing: ' + state.rxSymbolFrequencySpacing.toFixed(2) + ' Hz';

    return s;
}

function getDataLinkFrameHex(header, payload, checksum) {
    return '' +
        '<span class="data-link-frame-hex">' +
        getByteHexFromByte(header) + ' ' +
        getByteHexFromByteList(payload) + ' ' +
        getByteHexFromByte(checksum) +
        '</span>';
}

function getDataLinkFrameCandidateHex(byteReceived, byteExpected) {
    var
        emptyByte = '.. .. .. .. .. .. .. .. .. .. ', // Yes, you're right. I was little lazy in this piece of code...
        hex;

    hex = getByteHexFromByteList(byteReceived) + ' ';
    hex += emptyByte;
    hex = hex.substring(0, byteExpected * 3);

    return '<span class="data-link-frame-hex">' + hex + '</span>';
}

function getPrettyDateTime(date) {
    var
        year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate(),
        hour = date.getHours(),
        minute = date.getMinutes(),
        second = date.getSeconds(),
        milisecond = date.getMilliseconds();

    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    hour = hour < 10 ? '0' + hour : hour;
    minute = minute < 10 ? '0' + minute : minute;
    second = second < 10 ? '0' + second : second;
    milisecond = milisecond >= 100
        ? milisecond
        : (
            milisecond < 10 ? '00' + milisecond : '0' + milisecond
        );

    return year + '.' + month + '.' + day + ' ' +
        hour + ':' + minute + ':' + second + '.' + milisecond;
}
