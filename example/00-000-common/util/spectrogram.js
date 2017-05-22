// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

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

Spectrogram.unitToHue = function (unit) {
    var result = 240 * (1 - (1 / 0.6) * (unit - 0.2));

    result = result < 0 ? 0 : result;
    result = result > 240 ? 240 : result;

    return result;
};

Spectrogram.unitToLight = function (unit) {
    if (unit >= 0.2 && unit <= 0.8) {
        return 60;
    }
    if (unit < 0.2) {
        return 20 + 40 * (unit / 0.2);
    }
    if (unit > 0.8) {
        return 60 - 10 * ((unit - 0.8) / 0.2);
    }
};

Spectrogram.decibelToUnit = function (decibel) {
    var result = (100 + decibel) / 100;

    result = result > 1 ? 1 : result;
    result = result < 0 ? 0 : result;

    return result;
};

Spectrogram.getColor = function (decibel) {
    var unit, hue, light, color;

    unit = Spectrogram.decibelToUnit(decibel);
    hue = Spectrogram.unitToHue(unit);
    light = Spectrogram.unitToLight(unit);
    color = 'hsl(' + hue + ', 80%, ' + light + '%)';

    return color;
};

Spectrogram.prototype.$$reset = function () {
    document.getElementById(this.$$id).innerHTML = '';
    this.$$rowCountVisible = 0;
    this.$$rowCountTotal = 0;
};

Spectrogram.prototype.forceClearInNextAdd = function () {
    this.$$lastDataLength = null;
};

Spectrogram.prototype.add = function (data, loudestIndex, rxIndexMin, rxResolutionValue, isSampleToStore) {
    var i, lastRow, legend, marker;

    if (this.$$lastDataLength !== data.length) {
        this.$$lastDataLength = data.length;
        this.$$reset();

        legend = [];
        for (i = 0; i < data.length; i++) {
            legend.push(
                -100 + 100 * i / (data.length - 1)
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

    if (this.$$rowCountVisible === 64) {
        lastRow = document.querySelectorAll('#' + this.$$id + ' .s-row:last-child')[0];
        lastRow.parentNode.removeChild(lastRow);
        this.$$rowCountVisible--;
    }

    this.$$add(data, loudestIndex, isSampleToStore);
    this.$$rowCountVisible++;
    this.$$rowCountTotal++;
};

Spectrogram.prototype.$$add = function (data, loudestIndex, isSampleToStore) {
    var i, html, divRow, title, decibelForColor, color, secondRow, isDataRow;

    isDataRow = typeof loudestIndex !== 'undefined' && typeof isSampleToStore !== 'undefined';

    html = '';
    if (isDataRow) {
        decibelForColor = isSampleToStore ? -35 : -100;
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
        html += '<div class="s-cell ' + (loudestIndex === i ? 'mark' : '') + '" title="' + data[i].toFixed(1) + ' dB" style="background-color: ' + color + '">';
        html += '</div>';
    }

    divRow = document.createElement('div');
    divRow.className = 's-row';
    divRow.innerHTML = html;

    secondRow = document.querySelectorAll('#' + this.$$id + ' .s-row:nth-child(2)')[0];
    if (!secondRow) {
        document.getElementById(this.$$id).appendChild(divRow);
    } else {
        secondRow.parentNode.insertBefore(divRow, secondRow.nextSibling);     // this is acctually 'insertAfter' the second element
    }
};