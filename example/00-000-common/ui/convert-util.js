// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    UNICODE_UNKNOWN = '�',
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

function byteToText(byte) {
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
        char = String.fromCharCode(byteList[i]);
        result += isPrintableAscii(char) ? char : UNICODE_UNKNOWN;
    }

    return result;
}

function pad(num, size) {
    var s = '000000000' + num;

    return s.substr(s.length - size);
}

