// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PowerBar;

PowerBar = function (domElement) {
    this.$$id = 'power-bar-' + Math.round(Math.random() * 1000000);
    this.$$domElement = domElement;
    this.$$domElementSignal = undefined;
    this.$$domElementNoise = undefined;
    this.$$domElementSignalThreshold = undefined;
    this.$$domElementSignalAverage = undefined;
    this.$$domElementNoiseAverage = undefined;
    this.$$initializeHtml();
};

PowerBar.$$_DECIBEL_MIN = 140;

PowerBar.prototype.$$initializeHtml = function () {
    var html;

    html = '' +
        '<div class="power-bar" id="' + this.$$id + '">' +
        '    <div class="above-2 power-bar-signal"></div>' +
        '    <div class="above-1 power-bar-noise"></div>' +
        '    <div class="inside power-bar-signal-threshold"></div>' +
        '    <div class="below-1 power-bar-signal-average"></div>' +
        '    <div class="below-2 power-bar-noise-average"></div>' +
        '</div>';

    this.$$domElement.innerHTML = html;

    this.$$domElementSignal = document.querySelector('#' + this.$$id + ' .power-bar-signal');
    this.$$domElementNoise = document.querySelector('#' + this.$$id + ' .power-bar-noise');
    this.$$domElementSignalThreshold = document.querySelector('#' + this.$$id + ' .power-bar-signal-threshold');
    this.$$domElementSignalAverage = document.querySelector('#' + this.$$id + ' .power-bar-signal-average');
    this.$$domElementNoiseAverage = document.querySelector('#' + this.$$id + ' .power-bar-noise-average');
};

PowerBar.prototype.setSignalDecibel = function (decibel) {
    this.$$domElementSignal.innerHTML = 'signal: ' + decibel.toFixed(1) + ' dB';
    this.$$domElementSignal.style = 'right: ' + PowerBar.$$decibelToPercent(decibel) + '%';
};

PowerBar.prototype.setNoiseDecibel = function (decibel) {
    this.$$domElementNoise.innerHTML = 'noise: ' + decibel.toFixed(1) + ' dB';
    this.$$domElementNoise.style = 'right: ' + PowerBar.$$decibelToPercent(decibel) + '%';
};

PowerBar.prototype.setSignalDecibelThreshold = function (decibel) {
    this.$$domElementSignalThreshold.innerHTML = 'threshold: ' + decibel.toFixed(1) + ' dB';
    this.$$domElementSignalThreshold.style = 'right: ' + PowerBar.$$decibelToPercent(decibel) + '%';
};

PowerBar.prototype.setSignalDecibelAverage = function (decibel) {
    this.$$domElementSignalAverage.innerHTML = 'signal avg: ' + decibel.toFixed(1) + ' dB';
    this.$$domElementSignalAverage.style = 'right: ' + PowerBar.$$decibelToPercent(decibel) + '%';
};

PowerBar.prototype.setNoiseDecibelAverage = function (decibel) {
    this.$$domElementNoiseAverage.innerHTML = 'noise avg: ' + decibel.toFixed(1) + ' dB';
    this.$$domElementNoiseAverage.style = 'right: ' + PowerBar.$$decibelToPercent(decibel) + '%';
};

PowerBar.$$decibelToPercent = function (decibel) {
    var result = Math.abs(decibel);

    result = result > PowerBar.$$_DECIBEL_MIN ? PowerBar.$$_DECIBEL_MIN : result;
    result = result < 0 ? 0 : result;

    return 100 * result / PowerBar.$$_DECIBEL_MIN;
};
