// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var EditableFloatWidget;

EditableFloatWidget = function (domElement, value, digitBeforeTheDot, digitAfterTheDot, handler) {
    this.$$id = 'editable-float-widget-' + Math.round(Math.random() * 1000000);
    this.$$domElement = domElement;
    this.$$value = null;

    this.$$digitBeforeTheDot = digitBeforeTheDot;
    this.$$digitAfterTheDot = digitAfterTheDot;
    this.$$handler = handler;

    this.$$initializeHtml();
    EditableFloatWidget.$$instancesList.push({
        id: this.$$id,
        reference: this
    });
    this.setValue(value);
};

EditableFloatWidget.$$instancesList = [];

EditableFloatWidget.dispatchAction = function (id, action, digitPosition) {
    var i, instanceEntry, instance;

    instance = null;
    for (i = 0; i < EditableFloatWidget.$$instancesList.length; i++) {
        instanceEntry = EditableFloatWidget.$$instancesList[i];

        if (instanceEntry.id === id) {
            instance = instanceEntry.reference;
            break;
        }
    }

    if (instance) {
        instance.onClick(action, digitPosition);
    }
};

EditableFloatWidget.prototype.setValue = function (value) {
    this.$$value = parseFloat(
        value.toFixed(this.$$digitAfterTheDot)
    );
    this.$$updateDigitInWidget();
    // this.$$handler(this.$$value); // TODO verify if needed
};

EditableFloatWidget.prototype.getValue = function () {
    return this.$$value;
};

EditableFloatWidget.prototype.onClick = function (action, digitPosition) {
    this.$$value = EditableFloatWidget.changeDigitInFloat(
        action,
        digitPosition,
        this.$$value,
        this.$$digitBeforeTheDot,
        this.$$digitAfterTheDot
    );
    this.$$updateDigitInWidget();
    this.$$handler(this.$$value);
};

EditableFloatWidget.prototype.$$initializeHtml = function () {
    var html, i;

    html = '';
    
    html += '<div class="editable-float-widget clearfix" id="' + this.$$id + '">';

    for (i = this.$$digitBeforeTheDot - 1; i >= -this.$$digitAfterTheDot; i--) {
        if (i === -1) {
            html += '<div><span>.</span></div>';
        }

        html += '    <div>';
        html += '        <a href="javascript:void(0)" class="digit-plus" onClick="EditableFloatWidget.dispatchAction(\'' + this.$$id + '\', \'+\', ' + i + ')"></a>';
        html += '        <a href="javascript:void(0)" class="digit-minus" onClick="EditableFloatWidget.dispatchAction(\'' + this.$$id + '\', \'-\', ' + i + ')"></a>';
        html += '        <span class="digit_' + i + '">-</span>';
        html += '    </div>';
    }

    this.$$domElement.innerHTML = html;
};

EditableFloatWidget.prototype.$$updateDigitInWidget = function () {
    var element, digitSelector, digitValue, selector, i;

    for (i = this.$$digitBeforeTheDot - 1; i >= -this.$$digitAfterTheDot; i--) {
        digitValue = EditableFloatWidget.getDecimalDigit(this.$$value, i, this.$$digitAfterTheDot);
        digitSelector = '.digit_' + i;
        selector = '#' + this.$$domElement.id + ' span' + digitSelector;
        element = document.querySelector(selector);
        element.innerHTML = digitValue;
    }
};

EditableFloatWidget.changeDigitInFloat = function (action, digitPosition, value, digitBeforeTheDot, digitAfterTheDot) {
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
};

EditableFloatWidget.getDecimalDigit = function (value, digitPosition, digitAfterTheDot) {
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
};
