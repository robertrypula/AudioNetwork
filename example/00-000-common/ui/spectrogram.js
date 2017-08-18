// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Spectrogram;

Spectrogram = function (domElement) {
    this.$$id = 'spectrogram-' + Math.round(Math.random() * 1000000);
    this.$$domElement = domElement;
    this.$$keyLast = null;
    this.$$renderedRowCounter = 0;
    this.$$indexMin = null;
    this.$$indexMax = null;
    this.$$frequencySpacing = null;

    this.$$initializeHtml();
};

Spectrogram.INDEX_MARKER_DISABLED = false;
Spectrogram.ROW_MARKER_DISABLED = false;
Spectrogram.DECIBEL_MIN = -160;
Spectrogram.DECIBEL_FOR_COLOR_LIGHT = -36;
Spectrogram.DECIBEL_FOR_COLOR_DARK = -160;
Spectrogram.RENDERED_ROW_MAX = 2 + 32;   // 2 for header, 30 for data
Spectrogram.LEFT_COLUMN_MODE_HEADER = 'LEFT_COLUMN_MODE_HEADER';
Spectrogram.LEFT_COLUMN_MODE_COLOR_LIGHT = 'LEFT_COLUMN_MODE_COLOR_LIGHT';
Spectrogram.LEFT_COLUMN_MODE_COLOR_DARK = 'LEFT_COLUMN_MODE_COLOR_DARK';
Spectrogram.ARRAY_INDEX_OUT_OF_RANGE_EXCEPTION = 'Array index out of range';

Spectrogram.prototype.add = function (frequencyData, indexMin, indexMax, frequencySpacing, indexMarker, rowMarker) {
    var
        key = Spectrogram.$$getKey(frequencyData, indexMin, indexMax, frequencySpacing),
        reinitializationNeeded = key !== this.$$keyLast,
        leftColumnMode,
        data,
        lastRowNeedsToBeRemoved,
        lastRow;

    if (frequencyData.length === 0) {
        return;
    }

    if (reinitializationNeeded) {
        this.$$reset();
        this.$$keyLast = key;
        this.$$indexMin = indexMin;
        this.$$indexMax = indexMax;
        this.$$frequencySpacing = frequencySpacing;

        data = this.$$generateHeaderLegend(frequencyData.length);
        this.$$insertRow(Spectrogram.LEFT_COLUMN_MODE_HEADER, data, Spectrogram.INDEX_MARKER_DISABLED);

        data = this.$$generateHeaderMarker(frequencyData.length);
        this.$$insertRow(Spectrogram.LEFT_COLUMN_MODE_HEADER, data, Spectrogram.INDEX_MARKER_DISABLED);
    }

    leftColumnMode = rowMarker
        ? Spectrogram.LEFT_COLUMN_MODE_COLOR_LIGHT
        : Spectrogram.LEFT_COLUMN_MODE_COLOR_DARK;
    this.$$insertRow(leftColumnMode, frequencyData, indexMarker);

    lastRowNeedsToBeRemoved = this.$$renderedRowCounter > Spectrogram.RENDERED_ROW_MAX;
    if (lastRowNeedsToBeRemoved) {
        lastRow = document.querySelectorAll('#' + this.$$id + ' > .s-row:last-child')[0];
        lastRow.parentNode.removeChild(lastRow);
        this.$$renderedRowCounter--;
    }
};

Spectrogram.prototype.$$initializeHtml = function () {
    var html;

    html = '';
    html += '<div class="spectrogram-container">';
    html += '    <div class="spectrogram" id="' + this.$$id + '"></div>';
    html += '</div>';

    this.$$domElement.innerHTML = html;
};

Spectrogram.prototype.$$reset = function () {
    document.getElementById(this.$$id).innerHTML = '';
    this.$$renderedRowCounter = 0;
    this.$$keyLast = null;
    this.$$indexMin = null;
    this.$$indexMax = null;
    this.$$frequencySpacing = null;
};

Spectrogram.$$getKey = function (frequencyData, indexMin, indexMax, frequencySpacing) {
    return frequencyData.length + '|' + indexMin + '|' + indexMax + '|' + frequencySpacing.toFixed(12);
};

Spectrogram.prototype.$$generateHeaderLegend = function (length) {
    var i, decibel, decibelOffset, legend, range, innerIndex;

    legend = [];
    for (i = 0; i < length; i++) {
        if (i < this.$$indexMin || i > this.$$indexMax) {
            decibel = -Infinity;
        } else {
            range = this.$$indexMax - this.$$indexMin;
            innerIndex = i - this.$$indexMin;
            decibelOffset = (-Spectrogram.DECIBEL_MIN * innerIndex) / range;

            decibel = Spectrogram.DECIBEL_MIN + decibelOffset;
        }
        legend.push(decibel);
    }

    return legend;
};

Spectrogram.prototype.$$generateHeaderMarker = function (length) {
    var i, decibel, marker;

    marker = [];
    for (i = 0; i < length; i++) {
        if (i < this.$$indexMin || i > this.$$indexMax) {
            decibel = -Infinity;
        } else {
            decibel = i % 2 === 0
                ? Spectrogram.DECIBEL_FOR_COLOR_LIGHT
                : Spectrogram.DECIBEL_FOR_COLOR_DARK;
        }
        marker.push(decibel);
    }

    return marker;
};

Spectrogram.prototype.$$insertRow = function (leftColumnMode, data, indexMarker) {
    var
        row = Spectrogram.$$getRow(),
        isHeader = leftColumnMode === Spectrogram.LEFT_COLUMN_MODE_HEADER,
        cssClass = '',
        color = 'transparent',
        title = '',
        secondRow,
        decibel,
        cell,
        i;

    switch (leftColumnMode) {
        case Spectrogram.LEFT_COLUMN_MODE_COLOR_LIGHT:
            color = Spectrogram.$$getColor(Spectrogram.DECIBEL_FOR_COLOR_LIGHT);
            break;
        case Spectrogram.LEFT_COLUMN_MODE_COLOR_DARK:
            color = Spectrogram.$$getColor(Spectrogram.DECIBEL_FOR_COLOR_DARK);
            break;
    }
    cell = Spectrogram.$$getCell(cssClass, color, title);
    row.appendChild(cell);

    for (i = this.$$indexMin; i <= this.$$indexMax; i++) {
        decibel = data[i];
        if (typeof decibel === 'undefined') {
            throw Spectrogram.ARRAY_INDEX_OUT_OF_RANGE_EXCEPTION;
        }
        cssClass = indexMarker === i ? 's-cell-mark' : '';
        color = Spectrogram.$$getColor(decibel);
        title = '[' + i + '] ' + (i * this.$$frequencySpacing).toFixed(2) + ' Hz';
        if (!isHeader) {
            title += ', ' + decibel.toFixed(1) + ' dB';
        }
        cell = Spectrogram.$$getCell(cssClass, color, title);
        row.appendChild(cell);
    }

    if (isHeader) {
        document.getElementById(this.$$id).appendChild(row);
    } else {
        // this is how you do 'insertAfter' in JavaScript ;)
        secondRow = document.querySelector('#' + this.$$id + ' > .s-row:nth-child(2)');
        secondRow.parentNode.insertBefore(row, secondRow.nextSibling);
    }

    this.$$renderedRowCounter++;
};

Spectrogram.$$getCell = function (cssClass, color, title) {
    var cell;

    cell = document.createElement('div');
    cell.className = 's-cell ' + cssClass;
    cell.style.backgroundColor = color;
    cell.setAttribute('title', title);

    return cell;
};

Spectrogram.$$getRow = function () {
    var row;

    row = document.createElement('div');
    row.className = 's-row';

    return row;
};

Spectrogram.$$getColor = function (decibel) {
    var color, hsl;

    hsl = Spectrogram.$$getHsl(decibel);
    color = 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';

    return color;
};

Spectrogram.$$getHsl = function (decibel) {
    var
        colorMap = [
            {decibel: -160, hsl: [240, 80, 10]},
            {decibel: -100, hsl: [240, 80, 20]},
            {decibel: -80, hsl: [240, 80, 60]},
            {decibel: -50, hsl: [120, 80, 60]},
            {decibel: -30, hsl: [41, 80, 60]},
            {decibel: -20, hsl: [0, 80, 60]},
            {decibel: 0, hsl: [0, 80, 50]}
        ],
        lastIndex = colorMap.length - 1,
        hsl,
        value,
        unitPosition,
        colorLower,
        colorUpper,
        i;

    if (decibel <= colorMap[0].decibel) {
        return colorMap[0].hsl;
    }

    if (decibel >= colorMap[lastIndex].decibel) {
        return colorMap[lastIndex].hsl;
    }

    for (i = 0; i <= lastIndex; i++)
        if (colorMap[i].decibel >= decibel) {
            i = i - 1;
            break;
        }

    colorLower = colorMap[i];
    colorUpper = colorMap[i + 1];

    unitPosition = (decibel - colorLower.decibel) / (colorUpper.decibel - colorLower.decibel);
    unitPosition = unitPosition < 0.0 ? 0.0 : unitPosition;
    unitPosition = unitPosition > 1.0 ? 1.0 : unitPosition;

    hsl = [];
    for (i = 0; i < 3; i++) {
        value = Spectrogram.$$ease(colorLower.hsl[i], colorUpper.hsl[i], unitPosition);
        if (i === 0) {
            value = (value + 360) % 360;
        } else {
            value = value < 0 ? 0 : value;
            value = value > 100 ? 100 : value;
        }
        hsl.push(parseFloat(value.toFixed(2)));
    }

    return hsl;
};

Spectrogram.$$ease = function (min, max, unitPosition) {
    return min + (max - min) * 0.5 * (Math.sin(unitPosition * Math.PI - 0.5 * Math.PI) + 1.0);
};
