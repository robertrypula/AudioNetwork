// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// TODO: refactor the code!!!

var Spectrogram;

Spectrogram = function (domElement) {
    this.$$id = 'spectrogram-' + Math.round(Math.random() * 1000000);
    this.$$domElement = domElement;
    this.$$lastDataLength = null;
    this.$$rowCountVisible = 0;
    this.$$rowCountTotal = 0;

    this.$$initializeHtml();
};

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
    this.$$rowCountVisible = 0;
    this.$$rowCountTotal = 0;
};

Spectrogram.prototype.forceClearInNextAdd = function () {
    this.$$lastDataLength = null;
};

Spectrogram.prototype.add = function (data, loudestIndex, rxIndexMin, rxResolutionValue, isSymbolSamplingPoint) {
    var i, lastRow, legend, marker;

    if (this.$$lastDataLength !== data.length) {
        this.$$lastDataLength = data.length;
        this.$$reset();

        legend = [];
        for (i = 0; i < data.length; i++) {
            legend.push(
                -160 + 160 * i / (data.length - 1)
            );
        }
        this.$$add(legend);

        marker = [];
        for (i = 0; i < data.length; i++) {
            marker.push(
                Math.round((rxIndexMin + i) / rxResolutionValue) % 2 === 0 ? -35 : -100
            );
        }
        this.$$add(marker);
    }

    if (this.$$rowCountVisible === 35) {
        lastRow = document.querySelectorAll('#' + this.$$id + ' .s-row:last-child')[0];
        lastRow.parentNode.removeChild(lastRow);
        this.$$rowCountVisible--;
    }

    this.$$add(data, loudestIndex, isSymbolSamplingPoint);
    this.$$rowCountVisible++;
    this.$$rowCountTotal++;
};

Spectrogram.prototype.$$add = function (data, loudestIndex, isSymbolSamplingPoint) {
    var i, html, divRow, title, decibelForColor, color, secondRow, isDataRow;

    isDataRow = typeof loudestIndex !== 'undefined' && typeof isSymbolSamplingPoint !== 'undefined';

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

    for (i = 0; i < data.length; i++) {
        color = Spectrogram.getColor(data[i]);
        html += '<div class="s-cell ' + (loudestIndex === i && isSymbolSamplingPoint ? 'mark' : '') + '" title="' + data[i].toFixed(1) + ' dB" style="background-color: ' + color + '">';
        html += '</div>';
    }

    divRow = document.createElement('div');
    divRow.className = 's-row';
    /*
    if (isDataRow && !isSymbolSamplingPoint) {
        divRow.style = 'opacity: 0.8';
    }
    */

    divRow.innerHTML = html;

    secondRow = document.querySelectorAll('#' + this.$$id + ' .s-row:nth-child(2)')[0];
    if (!secondRow) {
        document.getElementById(this.$$id).appendChild(divRow);
    } else {
        secondRow.parentNode.insertBefore(divRow, secondRow.nextSibling);     // this is acctually 'insertAfter' the second element
    }
};