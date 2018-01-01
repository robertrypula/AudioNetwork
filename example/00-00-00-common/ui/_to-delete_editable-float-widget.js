// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function getDecimalDigit(value, digitPosition, digitAfterTheDot) {
    var
        valueStr = value.toFixed(digitAfterTheDot),
        dotIndex = valueStr.indexOf('.'),
        zeroPositionIndex,
        index,
        result = 0;

    if (dotIndex === -1) {
        zeroPositionIndex = valueStr.length - 1;
    } else {
        zeroPositionIndex = dotIndex - 1;
        valueStr = valueStr.replace('.', '');
    }

    index = zeroPositionIndex - digitPosition;
    if (index >= 0 && index < valueStr.length) {
        result = valueStr[index];
    }

    return result;
}

function changeDigitInFloat(action, digitPosition, value, digitBeforeTheDot, digitAfterTheDot) {
    var
        maxValue = Math.pow(10, digitBeforeTheDot) - 1,
        minValue = 0; // TODO check it: Math.pow(10, -digitAfterTheDot);

    switch (action) {
        case '+':
            value += Math.pow(10, digitPosition);
            value = value > maxValue ? maxValue : value;
            break;
        case '-':
            value -= Math.pow(10, digitPosition);
            value = value < minValue ? minValue : value;
            break;
    }

    value = parseFloat(
        value.toFixed(digitAfterTheDot)
    );

    return value;
}


function updateDigitInWidget(domElement, value, digitBeforeTheDot, digitAfterTheDot) {
    var element, digitSelector, digitValue, selector, i;

    for (i = digitBeforeTheDot - 1; i >= -digitAfterTheDot; i--) {
        digitValue = getDecimalDigit(value, i, digitAfterTheDot);
        digitSelector = '.digit_' + i;
        selector = '#' + domElement.id + ' span' + digitSelector;
        element = document.querySelector(selector);
        element.innerHTML = digitValue;
    }
}
