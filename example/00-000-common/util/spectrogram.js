// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Spectrogram;

Spectrogram = function (domElement) {
    this.$$id = 'spectrogram-' + Math.round(Math.random() * 1000000);
    this.$$domElement = domElement;
    this.$$lastDataLength = null;
    this.$$rowCount = 0;

    this.$$initializeHtml();
};

Spectrogram.prototype.$$initializeHtml = function () {
    var html;

    html = '';
    html += '<div class="spectrogram clearfix" id="' + this.$$id + '">';
    html += '</div>';

    this.$$domElement.innerHTML = html;
};

Spectrogram.prototype.clear = function () {

};

Spectrogram.getHueFromDecibel = function (decibel) {
    var tmp;

    tmp = 100 + decibel;
    tmp = tmp < 0 ? 0 : tmp;
    tmp = tmp > 100 ? 100 : tmp;
    tmp = 360 * tmp / 100;

    return tmp;
}

Spectrogram.prototype.add = function (data) {
    var i, html, firstRow, divRow, color;

    if (this.$$lastDataLength !== data.length) {
        document.getElementById(this.$$id).innerHTML = '';
        this.$$rowCount = 0;
    }

    if (this.$$rowCount > 64) {
        firstRow = document.querySelectorAll('#' + this.$$id + ' .s-row:first-child')[0];
        document.getElementById(this.$$id).removeChild(firstRow);
    }

    html = '';
    for (i = 0; i < data.length; i++) {
        color = Spectrogram.getHueFromDecibel(data[i]);
        html += '<div class="s-cell" title="' + data[i].toFixed(1) + ' dB" style="background-color: hsl(' + color + ', 100%, 30%)">';
        html += '</div>';
    }

    divRow = document.createElement('div');
    divRow.className = 's-row';
    divRow.innerHTML = html;
    document.getElementById(this.$$id).appendChild(divRow);
    this.$$rowCount++;

    this.$$lastDataLength = data.length;
};

