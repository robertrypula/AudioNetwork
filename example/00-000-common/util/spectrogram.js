// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// TODO: refactor the code!!!

var Spectrogram;

Spectrogram = function (domElement) {
    this.$$id = 'spectrogram-' + Math.round(Math.random() * 1000000);
    this.$$domElement = domElement;
    this.$$keyLast = null;
    this.$$rowCounter = 0;

    this.$$initializeHtml();
};

Spectrogram.INDEX_MARKER_DISABLED = false;
Spectrogram.ROW_MARKER_DISABLED = false;
Spectrogram.DECIBEL_MIN = -160;
Spectrogram.DECIBEL_FOR_COLOR_LIGHT = -36;
Spectrogram.DECIBEL_FOR_COLOR_DARK = -160;
Spectrogram.MAX_ROW = 37;

Spectrogram.LEFT_COLUMN_MODE_TRANSPARENT = 'LEFT_COLUMN_MODE_TRANSPARENT';
Spectrogram.LEFT_COLUMN_MODE_COLOR_LIGHT = 'LEFT_COLUMN_MODE_COLOR_LIGHT';
Spectrogram.LEFT_COLUMN_MODE_COLOR_DARK = 'LEFT_COLUMN_MODE_COLOR_DARK';

Spectrogram.prototype.$$initializeHtml = function () {
    var html;

    html = '';
    html += '<div class="spectrogram clearfix" id="' + this.$$id + '">';
    html += '</div>';

    this.$$domElement.innerHTML = html;
};

Spectrogram.getColor = function (decibel) {
    var color, hsl;

    hsl = Spectrogram.getHsl(decibel);
    color = 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';

    return color;
};

Spectrogram.getHsl = function (decibel) {
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

Spectrogram.prototype.$$reset = function () {
    document.getElementById(this.$$id).innerHTML = '';
    this.$$rowCounter = 0;
};

Spectrogram.$$getKey = function (frequencyData, indexMin, indexMax, frequencySpacing) {
    return frequencyData.length + '|' + indexMin + '|' + indexMax + '|' + frequencySpacing.toFixed(12);
};

Spectrogram.prototype.$$addLegend = function (frequencyDataLength, indexMin, indexMax, frequencySpacing) {
    var i, decibel, decibelOffset, legend, range, innerIndex;

    legend = [];
    for (i = 0; i < frequencyDataLength; i++) {
        if (i < indexMin || i > indexMax) {
            decibel = -Infinity;
        } else {
            range = indexMax - indexMin;
            innerIndex = i - indexMin;
            decibelOffset = (-Spectrogram.DECIBEL_MIN * innerIndex) / range;

            decibel = Spectrogram.DECIBEL_MIN + decibelOffset;
            console.log(decibel);
        }
        legend.push(decibel);
    }
    this.$$add(Spectrogram.LEFT_COLUMN_MODE_TRANSPARENT, legend, indexMin, indexMax, frequencySpacing);
};

Spectrogram.prototype.$$addMarker = function (frequencyDataLength, indexMin, indexMax, frequencySpacing) {
    var i, decibel, marker;

    marker = [];
    for (i = 0; i < frequencyDataLength; i++) {
        if (i < indexMin || i > indexMax) {
            decibel = -Infinity;
        } else {
            decibel = i % 2 === 0
                ? Spectrogram.DECIBEL_FOR_COLOR_LIGHT
                : Spectrogram.DECIBEL_FOR_COLOR_DARK;
        }
        marker.push(decibel);
    }
    this.$$add(Spectrogram.LEFT_COLUMN_MODE_TRANSPARENT, marker, indexMin, indexMax, frequencySpacing);
};

Spectrogram.prototype.add = function (frequencyData, indexMin, indexMax, frequencySpacing, indexMarker, rowMarker) {
    var
        key = Spectrogram.$$getKey(frequencyData, indexMin, indexMax, frequencySpacing),
        reinitializationNeeded = key !== this.$$keyLast,
        lastRow;

    if (reinitializationNeeded) {
        this.$$keyLast = key;
        this.$$reset();

        this.$$addLegend(frequencyData.length, indexMin, indexMax, frequencySpacing);
        this.$$addMarker(frequencyData.length, indexMin, indexMax, frequencySpacing);
    }

    // this.$$add(frequencyData, loudestIndex, isSymbolSamplingPoint);

    if (this.$$rowCounter === Spectrogram.MAX_ROW) {
        lastRow = document.querySelectorAll('#' + this.$$id + ' .s-row:last-child')[0];
        lastRow.parentNode.removeChild(lastRow);
        this.$$rowCounter--;
    }
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

Spectrogram.prototype.$$add = function (leftColumnMode, frequencyData, indexMin, indexMax, frequencySpacing) {
    var
        row = Spectrogram.$$getRow(),
        cssClass = '',
        color = 'transparent',
        title = '',
        secondRow,
        i,
        cell;


    switch (leftColumnMode) {
        case Spectrogram.LEFT_COLUMN_MODE_TRANSPARENT:
            cell = Spectrogram.$$getCell(cssClass, color, title);
            break;
            /*
        case Spectrogram.LEFT_COLUMN_MODE_COLOR_LIGHT:
        case Spectrogram.LEFT_COLUMN_MODE_COLOR_DARK:
            color =
            cell = Spectrogram.$$getCell(
                '',
                'white',
                ''
            );
            break;
        */
    }
    row.appendChild(cell);

    for (i = indexMin; i <= indexMax; i++) {
        cssClass = '';
        color = Spectrogram.getColor(frequencyData[i]);
        title =
            ('[' + i + '] ' + (i * frequencySpacing).toFixed(2) + ' Hz') +
            (leftColumnMode !== Spectrogram.LEFT_COLUMN_MODE_TRANSPARENT
                ? ', ' + frequencyData[i].toFixed(1) + ' dB'
                : '');
        cell = Spectrogram.$$getCell(cssClass, color, title);
        row.appendChild(cell);
    }

    secondRow = document.querySelectorAll('#' + this.$$id + ' .s-row:nth-child(2)')[0];
    if (!secondRow) {
        document.getElementById(this.$$id).appendChild(row);
    } else {
        secondRow.parentNode.insertBefore(row, secondRow.nextSibling);     // this is actually 'insertAfter' the second element
    }

    this.$$rowCounter++;

    /*
    var i, html, divRow, title, decibelForColor, color, secondRow, isDataRow;

    html = '';
    if (isDataRow) {
        decibelForColor = isSymbolSamplingPoint ? -35 : -160;
        color = Spectrogram.getColor(decibelForColor);
        title = 'title="sample #' + this.$$rowCountTotal + '"';
    } else {
        color = 'white';
        title = '';
    }
    html += '<div class="s-cell" ' + title + ' style="background-color: ' + color + '">';
    html += '</div>';

    for (i = 0; i < frequencyData.length; i++) {
        color = Spectrogram.getColor(frequencyData[i]);
        html += '<div class="s-cell ' + (loudestIndex === i && isSymbolSamplingPoint ? 'mark' : '') + '" title="' + frequencyData[i].toFixed(1) + ' dB" style="background-color: ' + color + '">';
        html += '</div>';
    }

    divRow = document.createElement('div');
    divRow.className = 's-row';

    divRow.innerHTML = html;

    secondRow = document.querySelectorAll('#' + this.$$id + ' .s-row:nth-child(2)')[0];
    if (!secondRow) {
        document.getElementById(this.$$id).appendChild(divRow);
    } else {
        secondRow.parentNode.insertBefore(divRow, secondRow.nextSibling);     // this is actually 'insertAfter' the second element
    }
    */
};