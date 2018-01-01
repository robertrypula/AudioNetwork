// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function getSamplePerPeriodFromIndex(index) {
    var step = (frequencyBinSamplePerPeriodMax - frequencyBinSamplePerPeriodMin) / frequencyBinSize;

    return frequencyBinSamplePerPeriodMax - step * index;
}

function getFrequencyFromIndex(index) {
    var samplePerPeriod = getSamplePerPeriodFromIndex(index);

    return SAMPLE_RATE / samplePerPeriod;
}

function parseIntFromForm(elementId) {
    return parseInt(document.getElementById(elementId).value);
}

function parseFloatFromForm(elementId) {
    return parseFloat(document.getElementById(elementId).value);
}
